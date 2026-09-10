import { ipcMain } from 'electron'
import { sessionService } from '../services/session.service'
import { sessionFiltersSchema } from '../validation/session.schema'
import { isActive } from '../auth/session'
import type { SessionFilters } from '@shared/session'

/**
 * Session channels. Handlers stay thin: check the session, validate,
 * delegate, return.
 */

function requireSession(): void {
  if (!isActive()) throw new Error('Your session has ended. Please sign in again.')
}

function fail(error: unknown): never {
  throw new Error(error instanceof Error ? error.message : 'Something went wrong')
}

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:list', (_event, filters: unknown) => {
    try {
      requireSession()
      const parsed = sessionFiltersSchema.parse(filters ?? {}) as SessionFilters
      return sessionService.list(parsed)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('sessions:get', (_event, id: number) => {
    try {
      requireSession()
      return sessionService.get(id)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('sessions:create', (_event, input: unknown) => {
    try {
      requireSession()
      return sessionService.create(input)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('sessions:update', (_event, id: number, input: unknown) => {
    try {
      requireSession()
      return sessionService.update(id, input)
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('sessions:delete', (_event, id: number) => {
    try {
      requireSession()
      sessionService.remove(id)
      return { ok: true }
    } catch (error) {
      fail(error)
    }
  })
}
