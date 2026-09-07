/**
 * Reference values from Application Design Document section 3.5.
 *
 * Defined once and imported by both processes. These drive the dropdown
 * options, the Zod validation ranges, and the tooltip labels in the report
 * graphs — so they must never be duplicated per screen.
 */

export const GENDERS = ['Male', 'Female', 'Prefer not to specify'] as const
export const AFFECTED_SIDES = ['Right', 'Left', 'Both'] as const
export const BIOFEEDBACK = ['On', 'Off'] as const
export const PATIENT_STATUSES = ['Active', 'Inactive'] as const

export type Gender = (typeof GENDERS)[number]
export type AffectedSide = (typeof AFFECTED_SIDES)[number]
export type Biofeedback = (typeof BIOFEEDBACK)[number]
export type PatientStatus = (typeof PATIENT_STATUSES)[number]

/** A numeric scale value together with the text shown beside it. */
export interface ScaleOption {
  value: number
  label: string
}

const scale = (labels: string[]): ScaleOption[] =>
  labels.map((label, i) => ({ value: i + 1, label }))

export const SENSORY_STATUS = scale([
  'Absent sensation / no reliable sensory perception',
  'Very severe sensory impairment',
  'Severe sensory impairment',
  'Moderate sensory impairment',
  'Mild sensory impairment',
  'Minimal sensory impairment / near-normal sensation',
  'Normal functional sensation'
])

export const MUSCLE_TONE = scale([
  'Severe hypotonia / flaccidity',
  'Moderate hypotonia',
  'Mild hypotonia',
  'Normal muscle tone',
  'Mildly increased tone / mild hypertonia',
  'Moderately increased tone / moderate hypertonia',
  'Severely increased tone / marked hypertonia'
])

export const PAIN_SCORE = scale([
  'No pain',
  'Very mild pain',
  'Mild pain',
  'Mild to moderate pain',
  'Moderate pain',
  'Moderately severe pain',
  'Severe pain',
  'Very severe pain',
  'Extremely severe pain',
  'Worst imaginable pain'
])

export const GENERAL_FEELING = scale([
  'Extremely poor',
  'Very poor',
  'Poor',
  'Below average',
  'Fair',
  'Slightly positive',
  'Good',
  'Very good',
  'Excellent',
  'Best possible feeling'
])

export const PERCEIVED_IMPROVEMENT = scale([
  'Much worse',
  'Moderately worse',
  'Slightly worse',
  'No noticeable change',
  'Slight improvement',
  'Moderate improvement',
  'Major improvement'
])

export const MUSCLE_RESPONSE = scale([
  'No observable muscle response',
  'Trace or minimal contraction',
  'Weak contraction with little movement',
  'Moderate contraction with partial movement',
  'Good contraction with useful movement',
  'Strong contraction with clear functional movement',
  'Very strong / optimal treatment response'
])

export const PATIENT_TOLERANCE = scale([
  'Unable to tolerate treatment',
  'Very poor tolerance',
  'Poor tolerance',
  'Acceptable tolerance',
  'Good tolerance',
  'Very good tolerance',
  'Excellent tolerance'
])

/** The five graphs on the Reports screen, in display order. */
export const CLINICAL_METRICS = [
  { key: 'painScore', title: 'Pain score', max: 10, options: PAIN_SCORE },
  { key: 'generalFeeling', title: 'General feeling', max: 10, options: GENERAL_FEELING },
  { key: 'perceivedImprovement', title: 'Perceived improvement', max: 7, options: PERCEIVED_IMPROVEMENT },
  { key: 'muscleResponse', title: 'Muscle response', max: 7, options: MUSCLE_RESPONSE },
  { key: 'patientTolerance', title: 'Patient tolerance', max: 7, options: PATIENT_TOLERANCE }
] as const

/** Formats a stored number as it is shown in dropdowns and tooltips: "3 – Mild pain". */
export function describeScore(options: ScaleOption[], value: number | null): string {
  if (value === null) return '—'
  const match = options.find((o) => o.value === value)
  return match ? `${value} – ${match.label}` : String(value)
}
