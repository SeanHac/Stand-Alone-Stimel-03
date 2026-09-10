import { app, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import path from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAuthHandlers } from './ipc/auth'
import { registerPatientHandlers } from './ipc/patients'
import { registerSessionHandlers } from './ipc/sessions'
import { registerProgramHandlers } from './ipc/programs'
// Pin the storage folder to a stable machine-friendly name. Electron would
// otherwise derive it from productName, which is a display string that may
// change — and moving a therapist's database after release means writing
// migration code for it. This must run before anything calls
// getPath('userData'), so it stays at module top level.
app.setPath('userData', path.join(app.getPath('appData'), 'stimel-03'))

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    title: 'Stimel-03',
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
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

  registerAuthHandlers()
  registerPatientHandlers()

  registerSessionHandlers()
  registerProgramHandlers()
  
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