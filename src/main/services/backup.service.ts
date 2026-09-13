import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { app } from 'electron'
import { closeDatabase, getDatabase, getDbPath } from '../db'
import { getVaultPath, vaultExists } from '../auth/vault'
import { endSession } from '../auth/session'

/**
 * Backup and restore. See Application Design Document section 8.
 *
 * A backup is a single portable file holding both halves of the
 * installation: the vault, which carries the wrapped database keys, and the
 * encrypted database itself. They must travel together — the database
 * cannot be opened without the vault, and the vault opens nothing without
 * the database.
 *
 * Nothing here adds encryption of its own. The database is already
 * encrypted at rest and the vault contains only salted hashes and AES-GCM
 * blobs, so the bundle is no more readable than its parts. The password
 * that opened the source installation opens the restored one.
 */

const MAGIC = Buffer.from('STIMEL03BAK\0', 'ascii') // 12 bytes
const FORMAT_VERSION = 1

interface Manifest {
  version: number
  createdAt: string
  appVersion: string
  authLength: number
  dbLength: number
  dbSha256: string
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Writes a backup to the chosen path.
 *
 * SQLite's online backup API cannot be used here: it refuses to copy an
 * encrypted database into a fresh target, because the two have different
 * cipher configurations. Instead the write-ahead log is checkpointed into
 * the main database file and the file is copied byte for byte, which
 * preserves the encryption exactly as it is on disk.
 *
 * The checkpoint is what makes the copy safe. In WAL mode recent writes
 * live in stimel.db-wal, so copying stimel.db alone would silently produce
 * a backup missing the most recent work.
 */
export async function createBackup(targetPath: string): Promise<void> {
  if (!vaultExists()) throw new Error('There is no account on this computer to back up')

  const db = getDatabase()

  // TRUNCATE waits for readers to finish, writes everything into the main
  // file, and empties the log. After this the database file is complete.
  db.$client.pragma('wal_checkpoint(TRUNCATE)')

  const dbBytes = await fsp.readFile(getDbPath())
  const authBytes = await fsp.readFile(getVaultPath())

  const manifest: Manifest = {
    version: FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: app.getVersion(),
    authLength: authBytes.length,
    dbLength: dbBytes.length,
    dbSha256: sha256(dbBytes)
  }

  const manifestBytes = Buffer.from(JSON.stringify(manifest), 'utf8')
  const header = Buffer.alloc(8)
  header.writeUInt32BE(FORMAT_VERSION, 0)
  header.writeUInt32BE(manifestBytes.length, 4)

  await fsp.writeFile(
    targetPath,
    Buffer.concat([MAGIC, header, manifestBytes, authBytes, dbBytes]),
    { mode: 0o600 }
  )
}

export interface BackupInfo {
  createdAt: string
  appVersion: string
}

/** Reads and validates a backup file without writing anything. */
export async function inspectBackup(sourcePath: string): Promise<BackupInfo> {
  const { manifest } = await readBackup(sourcePath)
  return { createdAt: manifest.createdAt, appVersion: manifest.appVersion }
}

async function readBackup(
  sourcePath: string
): Promise<{ manifest: Manifest; authBytes: Buffer; dbBytes: Buffer }> {
  const file = await fsp.readFile(sourcePath)

  if (file.length < MAGIC.length + 8 || !file.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('That file is not a Stimel-03 backup')
  }

  const manifestLength = file.readUInt32BE(MAGIC.length + 4)
  const manifestStart = MAGIC.length + 8
  const manifestEnd = manifestStart + manifestLength

  const manifest = JSON.parse(
    file.subarray(manifestStart, manifestEnd).toString('utf8')
  ) as Manifest

  if (manifest.version !== FORMAT_VERSION) {
    throw new Error('That backup was made by a different version of the application')
  }

  const authEnd = manifestEnd + manifest.authLength
  const authBytes = file.subarray(manifestEnd, authEnd)
  const dbBytes = file.subarray(authEnd, authEnd + manifest.dbLength)

  if (dbBytes.length !== manifest.dbLength || sha256(dbBytes) !== manifest.dbSha256) {
    throw new Error('That backup file is damaged and cannot be restored')
  }

  return { manifest, authBytes: Buffer.from(authBytes), dbBytes: Buffer.from(dbBytes) }
}

/**
 * Replaces all local data with the contents of a backup.
 *
 * Restore replaces; it never merges. Two installations both number their
 * patients from 1, so merging would collide — this is a property of the
 * identifier scheme, not a feature left out.
 *
 * The existing files are moved aside rather than deleted until the new ones
 * are safely in place, so a failure part-way through does not destroy the
 * data it was meant to replace.
 */
export async function restoreBackup(sourcePath: string): Promise<void> {
  const { authBytes, dbBytes } = await readBackup(sourcePath)

  // Release the database before overwriting the file underneath it.
  closeDatabase()
  endSession()

  const dbPath = getDbPath()
  const vaultPath = getVaultPath()
  const stamp = Date.now()

  const rollback: [string, string][] = []

  try {
    for (const target of [dbPath, vaultPath]) {
      if (fs.existsSync(target)) {
        const aside = `${target}.replaced-${stamp}`
        await fsp.rename(target, aside)
        rollback.push([aside, target])
      }
    }

    // Write-ahead log files belong to the database being replaced.
    for (const suffix of ['-wal', '-shm']) {
      await fsp.rm(`${dbPath}${suffix}`, { force: true })
    }

    await fsp.writeFile(dbPath, dbBytes, { mode: 0o600 })
    await fsp.writeFile(vaultPath, authBytes, { mode: 0o600 })
  } catch (error) {
    for (const [aside, target] of rollback) {
      await fsp.rename(aside, target).catch(() => undefined)
    }
    throw error
  }

  // Only now discard what was replaced.
  for (const [aside] of rollback) {
    await fsp.rm(aside, { force: true }).catch(() => undefined)
  }
}
