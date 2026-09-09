/**
 * Session lifetime. See Application Design Document section 4.3.
 *
 * Twelve hours from successful authentication. This is a fixed expiry, not
 * an idle timer: activity does not extend it. The countdown is owned here,
 * in the main process, so that reloading the window cannot restart it.
 */

const SESSION_MS = 12 * 60 * 60 * 1000
const WARNING_MS = 10 * 60 * 1000

interface ActiveSession {
  expiresAt: number
  dek: Buffer
}

let current: ActiveSession | null = null
let onExpire: (() => void) | null = null
let timer: NodeJS.Timeout | null = null

export function startSession(dek: Buffer): void {
  clearTimer()
  current = { expiresAt: Date.now() + SESSION_MS, dek }
  timer = setTimeout(() => endSession(), SESSION_MS)
}

export function endSession(): void {
  clearTimer()
  if (current) {
    // Overwrite the key material before releasing it.
    current.dek.fill(0)
    current = null
  }
  onExpire?.()
}

export function isActive(): boolean {
  return current !== null && Date.now() < current.expiresAt
}

/** The decrypted database key. Main process only — never returned over IPC. */
export function getDek(): Buffer {
  if (!current) throw new Error('No active session')
  return current.dek
}

export interface SessionStatus {
  active: boolean
  remainingMs: number
  warning: boolean
}

export function getStatus(): SessionStatus {
  if (!current) return { active: false, remainingMs: 0, warning: false }
  const remainingMs = Math.max(0, current.expiresAt - Date.now())
  return {
    active: remainingMs > 0,
    remainingMs,
    warning: remainingMs <= WARNING_MS
  }
}

/** Called when the session expires, so the interface can return to login. */
export function setExpiryHandler(handler: () => void): void {
  onExpire = handler
}

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}
