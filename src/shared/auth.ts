import { z } from 'zod'

/**
 * Validation shared by both processes. The renderer uses these for form
 * feedback; the main process re-validates with the same schemas before
 * anything is written. Renderer validation is convenience — the
 * main-process check is the authoritative one.
 */

/**
 * Password rules. Defined once so the registration form and the recovery
 * form cannot drift apart: a password accepted at sign-up must still be
 * accepted when it is reset.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    medicalLicenseNumber: z.string().trim().min(1, 'Medical license number is required'),
    username: z.string().trim().min(3, 'Username must be at least 3 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    state: z.string().trim().min(1, 'State is required'),
    city: z.string().trim().min(1, 'City is required'),
    fullAddress: z.string().trim().min(1, 'Full address is required'),
    disclaimerAccepted: z.literal(true)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

export type RegistrationInput = z.infer<typeof registrationSchema>

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export type LoginInput = z.infer<typeof loginSchema>

/** Account recovery: the key from onboarding, plus a replacement password. */
export const recoverySchema = z
  .object({
    recoveryKey: z.string().trim().min(1, 'Recovery key is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

export type RecoveryInput = z.infer<typeof recoverySchema>

export type StartupState = 'first-launch' | 'login'

export interface SessionStatus {
  active: boolean
  remainingMs: number
  warning: boolean
}

/** Formats remaining session time for the warning banner. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
