import { ipcMain } from 'electron'
import { asc } from 'drizzle-orm'
import { getDatabase } from '../db'
import { programs } from '../db/schema'
import { isActive } from '../auth/session'

/**
 * Program reference data. Read-only by specification — there is no create,
 * update or delete channel, because there is no interface path to any of
 * them. See Application Design Document section 6.10.
 */
export function registerProgramHandlers(): void {
  ipcMain.handle('programs:list', () => {
    if (!isActive()) throw new Error('Your session has ended. Please sign in again.')
    return getDatabase().select().from(programs).orderBy(asc(programs.id)).all()
  })
}
