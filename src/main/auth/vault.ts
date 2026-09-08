import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

/**
 * The unlock material, stored outside the encrypted database.
 *
 * It cannot live in the users table: these values are what decrypt the
 * database, so reading them from inside it would be circular.
 *
 * Nothing here is readable. It holds two salted hashes and two AES-GCM
 * blobs. No patient data, no profile fields, no plaintext password.
 */

export interface Vault {
  version: 1
  username: string
  passwordSalt: string
  passwordHash: string
  recoverySalt: string
  recoveryHash: string
  dekWrappedByPassword: string
  dekWrappedByRecovery: string
  createdAt: string
}

export function getVaultPath(): string {
  return path.join(app.getPath('userData'), 'auth.json')
}

/** Whether an account has been created on this machine. */
export function vaultExists(): boolean {
  return fs.existsSync(getVaultPath())
}

export function readVault(): Vault {
  const raw = fs.readFileSync(getVaultPath(), 'utf8')
  return JSON.parse(raw) as Vault
}

export function writeVault(vault: Vault): void {
  // Write to a temporary file and rename, so an interrupted write cannot
  // leave a truncated vault behind — which would lock the therapist out
  // of their own data permanently.
  const target = getVaultPath()
  const temp = `${target}.tmp`
  fs.writeFileSync(temp, JSON.stringify(vault, null, 2), { mode: 0o600 })
  fs.renameSync(temp, target)
}
