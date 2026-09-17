import { ipcMain, BrowserWindow } from 'electron'
import * as authService from '../auth/service'
import { getStatus, setExpiryHandler } from '../auth/session'
import { loginSchema, registrationSchema } from '../validation/auth.schema'

/**
 * Authentication channels. Handlers stay thin: validate, delegate, return.
 *
 * A wrong password or a mistyped recovery key is an expected outcome, not a
 * fault. Those return a result object rather than throwing, because an
 * exception crossing the IPC boundary writes a stack trace to the
 * main-process console every time — which buries genuine errors under
 * ordinary user mistakes.
 *
 * Real faults, such as an unreadable vault, still throw.
 */

export interface Result {
  ok: boolean
  message?: string
}

function failure(error: unknown, fallback: string): Result {
  return { ok: false, message: error instanceof Error ? error.message : fallback }
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:startupState', () => authService.getStartupState())

  ipcMain.handle('auth:createUser', (_event, input: unknown) => {
    try {
      const data = registrationSchema.parse(input)
      const { recoveryKey } = authService.createUser(data)
      return { ok: true as const, recoveryKey }
    } catch (error) {
      // Registration failures are validation problems the form should have
      // caught, so they are reported rather than thrown.
      return failure(error, 'Could not create the account')
    }
  })

  ipcMain.handle('auth:login', (_event, input: unknown) => {
    try {
      const { username, password } = loginSchema.parse(input)
      authService.login(username, password)
      return { ok: true as const }
    } catch (error) {
      return failure(error, 'Incorrect username or password')
    }
  })

  ipcMain.handle('auth:logout', () => {
    authService.logout()
    return { ok: true as const }
  })

  ipcMain.handle('auth:sessionStatus', () => getStatus())

  ipcMain.handle('auth:resetPassword', (_event, recoveryKey: string, newPassword: string) => {
    try {
      authService.resetPasswordWithRecoveryKey(recoveryKey, newPassword)
      return { ok: true as const }
    } catch (error) {
      return failure(error, 'That recovery key is not valid')
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
