/**
 * Authentication types and helpers.
 *
 * This file must import no validation library. It is loaded by the
 * renderer, whose Content Security Policy forbids eval — and Zod uses
 * new Function() internally, so importing it here breaks every screen that
 * pulls this module in, including the session banner on the app layout.
 *
 * The Zod schemas live in src/main/validation/auth.schema.ts.
 */

export interface RegistrationInput {
  firstName: string
  lastName: string
  medicalLicenseNumber: string
  username: string
  email: string
  password: string
  confirmPassword: string
  state: string
  city: string
  fullAddress: string
  disclaimerAccepted: boolean
}

export interface LoginInput {
  username: string
  password: string
}

export interface RecoveryInput {
  recoveryKey: string
  newPassword: string
  confirmPassword: string
}

export type StartupState = 'first-launch' | 'login'

export interface SessionStatus {
  active: boolean
  remainingMs: number
  warning: boolean
}

const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u

export function nameProblem(value: string, label: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required`
  if (!NAME_PATTERN.test(trimmed)) return `${label} may only contain letters`
  return null
}

/** Letters, digits, dot, underscore and hyphen. No spaces. */
export function usernameProblem(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length < 3) return 'Username must be at least 3 characters'
  if (!/^[\p{L}\p{N}._-]+$/u.test(trimmed)) {
    return 'Username may only contain letters, numbers, dots, underscores and hyphens'
  }
  return null
}


/** Formats remaining session time for the warning banner. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Password rules, hand-written so the renderer can show field errors
 * without loading a validation library. The main process enforces the same
 * rules with Zod; this copy is for feedback only.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Renderer-side check for the registration form. Returns field errors. */
export function validateRegistration(values: RegistrationInput): Record<string, string> {
  const errors: Record<string, string> = {}

  const nameFields: [keyof RegistrationInput, string][] = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['state', 'State'],
    ['city', 'City']
  ]

  for (const [field, label] of nameFields) {
    const problem = nameProblem(String(values[field] ?? ''), label)
    if (problem) errors[field] = problem
  }

  if (!values.medicalLicenseNumber.trim()) {
    errors.medicalLicenseNumber = 'Medical license number is required'
  }

  if (!values.fullAddress.trim()) {
    errors.fullAddress = 'Full address is required'
  }

  const usernameError = usernameProblem(values.username)
  if (usernameError) errors.username = usernameError

  if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address'
  }

  const passwordError = passwordProblem(values.password)
  if (passwordError) errors.password = passwordError

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (!values.disclaimerAccepted) {
    errors.disclaimerAccepted = 'You must accept the disclaimer to continue'
  }

  return errors
}

/** Renderer-side check for the recovery form. */
export function validateRecovery(values: RecoveryInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.recoveryKey.trim()) errors.recoveryKey = 'Recovery key is required'

  const passwordError = passwordProblem(values.newPassword)
  if (passwordError) errors.newPassword = passwordError

  if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}
