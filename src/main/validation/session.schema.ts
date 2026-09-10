import { z } from 'zod'
import { AFFECTED_SIDES, BIOFEEDBACK } from '@shared/clinical'
import type { SessionInput } from '@shared/session'

/**
 * Session validation. Main process only — this is the authoritative check.
 *
 * The five clinical feedback fields must accept null and store null. Design
 * document 6.11 requires a session with no value for a metric to be skipped
 * in that graph; a coerced zero would sit below the bottom of every scale
 * and distort the trend.
 */

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()

const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
  .transform((value) => (value === '' || value === null ? null : value))

const scale = (max: number): z.ZodNullable<z.ZodNumber> =>
  z.number().int().min(1).max(max).nullable()

export const sessionSchema = z.object({
  patientId: z.number().int().positive('Select a patient'),
  programId: z.number().int().positive('Select a program'),
  sessionDate: optionalDate,
  treatmentDurationMin: optionalText,
  biofeedback: z.enum(BIOFEEDBACK).nullable(),
  affectedSide: z.enum(AFFECTED_SIDES).nullable(),
  painScore: scale(10),
  generalFeeling: scale(10),
  perceivedImprovement: scale(7),
  muscleResponse: scale(7),
  patientTolerance: scale(7),
  notes: optionalText
})

export const sessionFiltersSchema = z.object({
  patientId: z.number().int().positive().nullable().optional(),
  programId: z.number().int().positive().nullable().optional(),
  dateFrom: optionalDate.optional(),
  dateTo: optionalDate.optional()
})

export function parseSession(input: unknown): SessionInput {
  return sessionSchema.parse(input) as SessionInput
}
