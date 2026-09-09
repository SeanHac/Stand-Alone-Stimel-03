import { ipcMain } from 'electron'
import { patientService } from '../services/patient.service'
import { isActive } from '../auth/session'

/**
 * Patient channels. Handlers stay thin: check the session, validate,
 * delegate, return.
 */

function requireSession(): void {
  // The renderer guards its own routes, but the renderer is not trusted.
  // Without this check, patient data would be reachable by any code that
  // can reach the bridge, session or no session.
  if (!isActive()) throw new Error('Your session has ended. Please sign in again.')
}

function fail(error: unknown): never {
  throw new Error(error instanceof Error ? error.message : 'Something went wrong')
}

export function registerPatientHandlers(): void {
  ipcMain.handle('patients:list', () => {
    try {
      requireSession()
      return patientService.list()
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('patients:listActive', () => {
    try {
      requireSession()
      return patientService.listActive()
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('patients:get', (_event, id: number) => {
    try {
      requireSession()
      return patientService.get(id)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('patients:create', (_event, input: unknown) => {
    try {
      requireSession()
      return patientService.create(input)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('patients:update', (_event, id: number, input: unknown) => {
    try {
      requireSession()
      return patientService.update(id, input)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('patients:delete', (_event, id: number) => {
    try {
      requireSession()
      patientService.remove(id)
      return { ok: true }
    } catch (error) {
      fail(error)
    }
  })
}
