import { dialog, ipcMain } from 'electron'
import { createBackup, inspectBackup, restoreBackup } from '../services/backup.service'
import { isActive } from '../auth/session'
import { vaultExists } from '../auth/vault'

/**
 * Backup channels. See Application Design Document section 8.
 *
 * Creating a backup requires an active session — it reads the decrypted
 * database. Restoring deliberately does not: it is reachable from first
 * launch on a new computer, where no account exists yet.
 */

function fail(error: unknown): never {
  throw new Error(error instanceof Error ? error.message : 'Something went wrong')
}

function timestampedName(): string {
  const now = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `stimel-03-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.stimelbak`
}

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:create', async () => {
    try {
      if (!isActive()) throw new Error('Your session has ended. Please sign in again.')

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save backup',
        defaultPath: timestampedName(),
        filters: [{ name: 'Stimel-03 backup', extensions: ['stimelbak'] }]
      })

      if (canceled || !filePath) return { ok: false as const }

      await createBackup(filePath)
      return { ok: true as const, filePath }
    } catch (error) {
      fail(error)
    }
  })

  /** Opens a file picker and validates the chosen backup without restoring. */
  ipcMain.handle('backup:choose', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select backup file',
        properties: ['openFile'],
        filters: [
          { name: 'Stimel-03 backup', extensions: ['stimelbak'] },
          { name: 'All files', extensions: ['*'] }
        ]
      })

      if (canceled || filePaths.length === 0) return { ok: false as const }

      const info = await inspectBackup(filePaths[0])

      return {
        ok: true as const,
        filePath: filePaths[0],
        createdAt: info.createdAt,
        appVersion: info.appVersion,
        // Whether this computer already holds data that would be replaced.
        hasExistingData: vaultExists()
      }
    } catch (error) {
      fail(error)
    }
  })

  ipcMain.handle('backup:restore', async (_event, filePath: string) => {
    try {
      await restoreBackup(filePath)
      return { ok: true as const }
    } catch (error) {
      fail(error)
    }
  })
}
