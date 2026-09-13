import { z } from 'zod'
import type { RegistrationInput } from '@shared/auth'

/**
 * Authentication validation. Main process only — this is the authoritative
 * check. The renderer performs its own lightweight checks for field
 * feedback, but the renderer is not trusted.
 *
 * Zod stays out of the renderer because the Content Security Policy there
 * forbids eval.
 *
 * The patterns here must match the hand-written checks in
 * src/shared/auth.ts. If one is changed, change the other: a value the form
 * accepts but the main process rejects becomes an error the therapist
 * cannot act on, because no field is marked.
 */

/**
 * Letters, spaces, apostrophes and hyphens. \p{L} covers every alphabet, so
 * names such as O'Brien, Jean-Luc, María and Müller are accepted while
 * digits and symbols are not.
 */
const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u

/** Letters, digits, dot, underscore and hyphen. No spaces. */
const USERNAME_PATTERN = /^[\p{L}\p{N}._-]+$/u

const nameField = (label: string): z.ZodString =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(NAME_PATTERN, `${label} may only contain letters`)

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const registrationSchema = z
  .object({
    firstName: nameField('First name'),
    lastName: nameField('Last name'),

    // Licence numbers contain digits and punctuation, so no letter pattern.
    medicalLicenseNumber: z.string().trim().min(1, 'Medical license number is required'),

    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .regex(
        USERNAME_PATTERN,
        'Username may only contain letters, numbers, dots, underscores and hyphens'
      ),

    email: z.string().trim().email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),

    state: nameField('State'),
    city: nameField('City'),

    // Addresses contain house numbers and postcodes, so no letter pattern.
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
