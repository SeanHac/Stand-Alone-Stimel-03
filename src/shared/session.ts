import type { AFFECTED_SIDES, BIOFEEDBACK } from './clinical'

/**
 * Session types and helpers. See Application Design Document sections 3.3
 * and 6.8–6.9.
 *
 * No validation library is imported here: this file is loaded by the
 * renderer, whose Content Security Policy forbids eval. The Zod schema
 * lives in src/main/validation/session.schema.ts.
 */

export type AffectedSide = (typeof AFFECTED_SIDES)[number]
export type Biofeedback = (typeof BIOFEEDBACK)[number]

export interface SessionInput {
  patientId: number
  sessionDate: string | null
  programId: number
  treatmentDurationMin: string | null
  biofeedback: Biofeedback | null
  affectedSide: AffectedSide | null
  painScore: number | null
  generalFeeling: number | null
  perceivedImprovement: number | null
  muscleResponse: number | null
  patientTolerance: number | null
  notes: string | null
}

/**
 * A row as returned to the interface. Patient and program names are joined
 * in the query rather than looked up per row in the renderer.
 */
export interface SessionRecord extends SessionInput {
  id: number
  patientFirstName: string | null
  patientLastName: string | null
  programName: string
  createdAt: string
  updatedAt: string
}

export interface SessionFilters {
  patientId?: number | null
  programId?: number | null
  dateFrom?: string | null
  dateTo?: string | null
}

/** Blank form values. Patient and program are chosen by the therapist. */
export const EMPTY_SESSION: Omit<SessionInput, 'patientId' | 'programId'> & {
  patientId: number | null
  programId: number | null
} = {
  patientId: null,
  sessionDate: null,
  programId: null,
  treatmentDurationMin: null,
  biofeedback: null,
  affectedSide: null,
  painScore: null,
  generalFeeling: null,
  perceivedImprovement: null,
  muscleResponse: null,
  patientTolerance: null,
  notes: null
}

export type SessionFormValues = typeof EMPTY_SESSION

/**
 * The specification stores treatment duration as free text. It is measured
 * in minutes, so a value that is not numeric is almost certainly a typo —
 * see design document open question 9.4.
 */
export function durationProblem(value: string | null): string | null {
  if (!value) return null
  return /^\d+(\.\d+)?$/.test(value.trim()) ? null : 'Enter the duration in minutes'
}
