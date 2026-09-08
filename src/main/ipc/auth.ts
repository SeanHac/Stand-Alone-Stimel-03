import { ipcMain, BrowserWindow } from 'electron'
import * as authService from '../auth/service'
import { getStatus, setExpiryHandler } from '../auth/session'
import { loginSchema, registrationSchema } from '../../shared/auth'

/**
 * Authentication channels. Handlers stay thin: validate, delegate, return.
 *
 * Errors are converted to plain messages. An exception object crossing the
 * process boundary would carry a stack trace into the renderer, and the
 * renderer has no use for one.
 */

function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  throw new Error(message)
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:startupState', () => authService.getStartupState())

  ipcMain.handle('auth:createUser', (_event, input: unknown) => {
    try {
      const data = registrationSchema.parse(input)
      return authService.createUser(data)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('auth:login', (_event, input: unknown) => {
    try {
      const { username, password } = loginSchema.parse(input)
      authService.login(username, password)
      return { ok: true }
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('auth:logout', () => {
    authService.logout()
    return { ok: true }
  })

  ipcMain.handle('auth:sessionStatus', () => getStatus())

  ipcMain.handle('auth:resetPassword', (_event, recoveryKey: string, newPassword: string) => {
    try {
      authService.resetPasswordWithRecoveryKey(recoveryKey, newPassword)
      return { ok: true }
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('auth:profile', () => authService.getProfile())

  // When the twelve hours elapse, tell every window to return to login.
  setExpiryHandler(() => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('auth:sessionExpired')
    }
  })
}
