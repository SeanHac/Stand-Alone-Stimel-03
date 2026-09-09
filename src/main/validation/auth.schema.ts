import { z } from 'zod'
import type { RegistrationInput } from '@shared/auth'

/**
 * Authentication validation. Main process only — this is the authoritative
 * check. The renderer performs its own lightweight checks for field
 * feedback, but the renderer is not trusted.
 *
 * Zod stays out of the renderer because the Content Security Policy there
 * forbids eval.
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

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export function parseRegistration(input: unknown): RegistrationInput {
  return registrationSchema.parse(input) as RegistrationInput
}
