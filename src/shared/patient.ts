import type { AFFECTED_SIDES, GENDERS, PATIENT_STATUSES } from './clinical'

/**
 * Patient types and display helpers. See Application Design Document
 * sections 3.2 and 6.7.
 *
 * This file deliberately imports no validation library. It is loaded by the
 * renderer, whose Content Security Policy forbids eval — and Zod uses
 * new Function() internally, so importing it here fails at runtime.
 *
 * The Zod schema lives in src/main/validation/patient.schema.ts and runs in
 * the main process, which is where the authoritative check belongs anyway.
 */

export type Gender = (typeof GENDERS)[number]
export type AffectedSide = (typeof AFFECTED_SIDES)[number]
export type PatientStatus = (typeof PATIENT_STATUSES)[number]

export interface PatientInput {
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  gender: Gender | null
  phoneNumber: string | null
  email: string | null
  address: string | null
  clinicalDiagnosis: string | null
  affectedSide: AffectedSide | null
  sensoryStatus: number | null
  muscleTone: number | null
  startDate: string | null
  emergencyContact: string | null
  notes: string | null
  status: PatientStatus
}

/** A row as returned to the interface. */
export interface PatientRecord extends PatientInput {
  id: number
  createdAt: string
  updatedAt: string
}

/** Blank form values. New patients are Active, per design document 6.7. */
export const EMPTY_PATIENT: PatientInput = {
  firstName: null,
  lastName: null,
  dateOfBirth: null,
  gender: null,
  phoneNumber: null,
  email: null,
  address: null,
  clinicalDiagnosis: null,
  affectedSide: null,
  sensoryStatus: null,
  muscleTone: null,
  startDate: null,
  emergencyContact: null,
  notes: null,
  status: 'Active'
}

/** Today as a calendar date string, matching how dates are stored. */
export function todayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Age from date of birth. Derived at display time and never stored, so it
 * cannot go stale in the database.
 */
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null

  const birth = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()

  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

/** Name for display when one or both parts are missing. */
export function patientDisplayName(patient: {
  firstName: string | null
  lastName: string | null
}): string {
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ')
  return name || 'Unnamed patient'
}

/** Formats a stored calendar date for display. */
export function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
