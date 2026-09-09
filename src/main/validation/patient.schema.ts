import { z } from 'zod'
import { AFFECTED_SIDES, GENDERS, PATIENT_STATUSES } from '@shared/clinical'
import type { PatientInput } from '@shared/patient'

/**
 * Patient validation. Main process only.
 *
 * Zod is not imported into the renderer: the Content Security Policy there
 * forbids eval, which Zod relies on internally. Keeping it here also means
 * validation happens where it actually matters — the renderer is not
 * trusted, so a check performed only in the interface would be decorative.
 *
 * Empty strings are normalised to null so that "not entered" is one value in
 * the database rather than two.
 */

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()

/** ISO calendar date, stored as text to avoid timezone drift. */
const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
  .transform((value) => (value === '' || value === null ? null : value))

const optionalScale = z.number().int().min(1).max(7).nullable()

export const patientSchema = z.object({
  firstName: optionalText,
  lastName: optionalText,
  dateOfBirth: optionalDate,
  gender: z.enum(GENDERS).nullable(),
  phoneNumber: optionalText,
  email: optionalText,
  address: optionalText,
  clinicalDiagnosis: optionalText,
  affectedSide: z.enum(AFFECTED_SIDES).nullable(),
  sensoryStatus: optionalScale,
  muscleTone: optionalScale,
  startDate: optionalDate,
  emergencyContact: optionalText,
  notes: optionalText,
  status: z.enum(PATIENT_STATUSES)
})

export function parsePatient(input: unknown): PatientInput {
  return patientSchema.parse(input) as PatientInput
}
