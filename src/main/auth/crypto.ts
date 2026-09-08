import { randomBytes, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto'

/**
 * Key derivation and envelope encryption. See Application Design Document
 * section 4.
 *
 * The database is encrypted with a random key (the DEK) that is never
 * derived from anything the user types. Two wrapped copies of that key are
 * stored: one unlocked by the password, one by the recovery key. Resetting
 * a password re-wraps 32 bytes rather than re-encrypting the database.
 */

const SCRYPT_KEYLEN = 32
const SCRYPT_OPTIONS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

/** Derives a 32-byte key from a secret and salt. Deliberately slow. */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret.normalize('NFKC'), salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS)
}

export function randomSalt(): Buffer {
  return randomBytes(16)
}

/** Generates the database encryption key. Never written to disk unwrapped. */
export function generateDek(): Buffer {
  return randomBytes(32)
}

/** Hashes a secret for verification. Returns hex. */
export function hashSecret(secret: string, salt: Buffer): string {
  return deriveKey(secret, salt).toString('hex')
}

/** Constant-time comparison, so verification time leaks nothing. */
export function verifySecret(secret: string, salt: Buffer, expectedHex: string): boolean {
  const actual = deriveKey(secret, salt)
  const expected = Buffer.from(expectedHex, 'hex')
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

/**
 * Wraps the DEK under a key derived from the given secret.
 * Layout: iv (12) | authTag (16) | ciphertext.
 */
export function wrapDek(dek: Buffer, secret: string, salt: Buffer): Buffer {
  const kek = deriveKey(secret, salt)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', kek, iv)
  const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext])
}

/** Unwraps the DEK. Throws if the secret is wrong or the blob was tampered with. */
export function unwrapDek(wrapped: Buffer, secret: string, salt: Buffer): Buffer {
  const kek = deriveKey(secret, salt)
  const iv = wrapped.subarray(0, 12)
  const authTag = wrapped.subarray(12, 28)
  const ciphertext = wrapped.subarray(28)

  const decipher = createDecipheriv('aes-256-gcm', kek, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Generates the recovery key shown once at onboarding.
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (128 bits).
 */
export function generateRecoveryKey(): string {
  const hex = randomBytes(16).toString('hex').toUpperCase()
  return (hex.match(/.{4}/g) ?? []).join('-')
}

/** Accepts the key with or without dashes, in any case. */
export function normaliseRecoveryKey(input: string): string {
  const compact = input.replace(/[\s-]/g, '').toUpperCase()
  return (compact.match(/.{4}/g) ?? []).join('-')
}
