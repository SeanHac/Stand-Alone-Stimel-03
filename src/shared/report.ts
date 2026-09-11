/**
 * Report types. See Application Design Document section 6.11.
 *
 * A report covers one patient and one program. It never compares programs
 * against each other.
 */

export interface TrendPoint {
  sessionId: number
  sessionDate: string | null
  painScore: number | null
  generalFeeling: number | null
  perceivedImprovement: number | null
  muscleResponse: number | null
  patientTolerance: number | null
}

export interface TrendQuery {
  patientId: number
  programId: number
  dateFrom?: string | null
  dateTo?: string | null
}

export interface ReportMeta {
  patientName: string
  programName: string
  dateFrom: string | null
  dateTo: string | null
}
