import { getDatabase, openDatabase, closeDatabase } from '../db'
import { users } from '../db/schema'
import {
  generateDek,
  generateRecoveryKey,
  hashSecret,
  normaliseRecoveryKey,
  randomSalt,
  unwrapDek,
  verifySecret,
  wrapDek
} from './crypto'
import { readVault, vaultExists, writeVault, type Vault } from './vault'
import { startSession, endSession } from './session'
import { registrationSchema, type RegistrationInput, type StartupState } from '../../shared/auth'

/**
 * Authentication. See Application Design Document sections 4 and 6.2–6.5.
 *
 * There is exactly one therapist per installation. Accounts cannot be
 * created from the login screen, and there is no user switching.
 */

export function getStartupState(): StartupState {
  return vaultExists() ? 'login' : 'first-launch'
}

export interface CreateUserResult {
  recoveryKey: string
}

/**
 * First-launch registration. Creates the encryption key, wraps it under
 * both the password and a freshly generated recovery key, writes the
 * vault, opens the database and records the profile.
 *
 * The recovery key is returned once and never retrievable again.
 */
export function createUser(input: RegistrationInput): CreateUserResult {
  if (vaultExists()) {
    throw new Error('An account already exists on this computer')
  }

  const data = registrationSchema.parse(input)

  const dek = generateDek()
  const recoveryKey = generateRecoveryKey()

  const passwordSalt = randomSalt()
  const recoverySalt = randomSalt()

  const vault: Vault = {
    version: 1,
    username: data.username,
    passwordSalt: passwordSalt.toString('hex'),
    passwordHash: hashSecret(data.password, passwordSalt),
    recoverySalt: recoverySalt.toString('hex'),
    recoveryHash: hashSecret(recoveryKey, recoverySalt),
    dekWrappedByPassword: wrapDek(dek, data.password, passwordSalt).toString('hex'),
    dekWrappedByRecovery: wrapDek(dek, recoveryKey, recoverySalt).toString('hex'),
    createdAt: new Date().toISOString()
  }

  // Open the database before writing the vault. If opening fails there is
  // no half-created account left behind.
  const db = openDatabase(dek.toString('hex'))

  const now = new Date()
  db.insert(users)
    .values({
      id: 1,
      firstName: data.firstName,
      lastName: data.lastName,
      medicalLicenseNumber: data.medicalLicenseNumber,
      username: data.username,
      email: data.email,
      state: data.state,
      city: data.city,
      fullAddress: data.fullAddress,
      disclaimerAcceptedAt: now,
      createdAt: now,
      updatedAt: now
    })
    .run()

  writeVault(vault)

  // Onboarding completes as a logged-in session (design doc 6.3).
  startSession(dek)

  return { recoveryKey }
}

/** Verifies credentials, unwraps the database key and opens the database. */
export function login(username: string, password: string): void {
  if (!vaultExists()) {
    throw new Error('No account exists on this computer')
  }

  const vault = readVault()
  const passwordSalt = Buffer.from(vault.passwordSalt, 'hex')

  // One message for both failure modes. Telling the user which half was
  // wrong would confirm whether a username exists.
  const usernameMatches = vault.username === username.trim()
  const passwordMatches = verifySecret(password, passwordSalt, vault.passwordHash)

  if (!usernameMatches || !passwordMatches) {
    throw new Error('Incorrect username or password')
  }

  const dek = unwrapDek(
    Buffer.from(vault.dekWrappedByPassword, 'hex'),
    password,
    passwordSalt
  )

  openDatabase(dek.toString('hex'))
  startSession(dek)
}

export function logout(): void {
  closeDatabase()
  endSession()
}

/**
 * Resets a forgotten password using the recovery key.
 *
 * The database is never re-encrypted: the same key is unwrapped with the
 * recovery secret and re-wrapped under the new password.
 */
export function resetPasswordWithRecoveryKey(recoveryKey: string, newPassword: string): void {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const vault = readVault()
  const recoverySalt = Buffer.from(vault.recoverySalt, 'hex')
  const supplied = normaliseRecoveryKey(recoveryKey)

  if (!verifySecret(supplied, recoverySalt, vault.recoveryHash)) {
    throw new Error('That recovery key is not valid')
  }

  const dek = unwrapDek(
    Buffer.from(vault.dekWrappedByRecovery, 'hex'),
    supplied,
    recoverySalt
  )

  const passwordSalt = randomSalt()

  writeVault({
    ...vault,
    passwordSalt: passwordSalt.toString('hex'),
    passwordHash: hashSecret(newPassword, passwordSalt),
    dekWrappedByPassword: wrapDek(dek, newPassword, passwordSalt).toString('hex')
  })

  dek.fill(0)
}

/** The signed-in therapist's profile, for display. */
export function getProfile(): { firstName: string; lastName: string; email: string } | null {
  const db = getDatabase()
  const row = db.select().from(users).limit(1).get()
  if (!row) return null
  return { firstName: row.firstName, lastName: row.lastName, email: row.email }
}
