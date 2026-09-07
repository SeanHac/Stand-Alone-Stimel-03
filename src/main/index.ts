import { app, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import { randomBytes } from 'node:crypto'
import icon from '../../resources/icon.png?asset'
// import { openDatabase, closeDatabase, getDbPath } from './db'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // The application has no external links. Deny every popup.
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------------
// TEMPORARY — encryption smoke test.
//
// Confirms two things before any real data model is built:
//   1. a database created with a key cannot be reopened with a different key
//   2. the file on disk contains no readable plain text
//
// Check (1) prints PASS in the terminal. Check (2) is run manually:
//   strings ~/Library/Application\ Support/*/stimel.db | grep PATIENT_NAME_MARKER
// Empty output is the pass.
//
// Delete this function and its call site once both checks have passed.
// ---------------------------------------------------------------------------
// function encryptionSmokeTest(): void {
//   const goodKey = randomBytes(32).toString('hex')

//   const db = openDatabase(goodKey)
//   db.$client.exec('CREATE TABLE IF NOT EXISTS probe (secret TEXT)')
//   db.$client.prepare("INSERT INTO probe VALUES ('PATIENT_NAME_MARKER')").run()
//   closeDatabase()

//   console.log('db path:', getDbPath())

//   const wrongKey = randomBytes(32).toString('hex')
//   try {
//     openDatabase(wrongKey)
//     console.error('FAIL — database opened with the wrong key')
//   } catch {
//     console.log('PASS — wrong key rejected')
//   } finally {
//     closeDatabase()
//   }
// }
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.motioninformatics.stimel03')

  // Content Security Policy. Skipped in development because Vite's
  // hot-reload websocket is blocked by it.
  if (!is.dev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; " +
              "font-src 'self' data:; " +
              "connect-src 'self'"
          ]
        }
      })
    })
  }

  // No screen in this application navigates away from itself.
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
      const isDevServer =
        is.dev &&
        process.env['ELECTRON_RENDERER_URL'] &&
        url.startsWith(process.env['ELECTRON_RENDERER_URL'])
      if (!isDevServer) event.preventDefault()
    })
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Temporary placeholder handler. Replaced by the real channels
  // listed in Section 7 of the design document.
  ipcMain.handle('health:ping', () => 'pong')

  // encryptionSmokeTest() // TEMPORARY — remove together with the function above

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
