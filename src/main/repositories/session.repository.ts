import { and, asc, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { getDatabase } from '../db'
import { patients, programs, sessions } from '../db/schema'
import type { SessionFilters, SessionInput } from '@shared/session'

/**
 * Data access for sessions. Queries only — no business rules.
 * See Application Design Document section 3.3.
 */

const listColumns = {
  id: sessions.id,
  patientId: sessions.patientId,
  programId: sessions.programId,
  sessionDate: sessions.sessionDate,
  treatmentDurationMin: sessions.treatmentDurationMin,
  biofeedback: sessions.biofeedback,
  affectedSide: sessions.affectedSide,
  painScore: sessions.painScore,
  generalFeeling: sessions.generalFeeling,
  perceivedImprovement: sessions.perceivedImprovement,
  muscleResponse: sessions.muscleResponse,
  patientTolerance: sessions.patientTolerance,
  notes: sessions.notes,
  createdAt: sessions.createdAt,
  updatedAt: sessions.updatedAt,
  patientFirstName: patients.firstName,
  patientLastName: patients.lastName,
  programName: programs.name
}

export const sessionRepository = {
  /** Sessions with patient and program names joined, newest first. */
  findAll(filters: SessionFilters = {}) {
    const conditions: SQL[] = []

    if (filters.patientId) conditions.push(eq(sessions.patientId, filters.patientId))
    if (filters.programId) conditions.push(eq(sessions.programId, filters.programId))
    if (filters.dateFrom) conditions.push(gte(sessions.sessionDate, filters.dateFrom))
    if (filters.dateTo) conditions.push(lte(sessions.sessionDate, filters.dateTo))

    return getDatabase()
      .select(listColumns)
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .innerJoin(programs, eq(sessions.programId, programs.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(sessions.sessionDate), desc(sessions.id))
      .all()
  },

  findById(id: number) {
    return (
      getDatabase()
        .select(listColumns)
        .from(sessions)
        .innerJoin(patients, eq(sessions.patientId, patients.id))
        .innerJoin(programs, eq(sessions.programId, programs.id))
        .where(eq(sessions.id, id))
        .get() ?? null
    )
  },

  /**
   * Feedback series for the report graphs: one patient, one program,
   * chronological. Design document 6.11.
   */
  findForReport(patientId: number, programId: number, dateFrom?: string | null, dateTo?: string | null) {
    const conditions: SQL[] = [
      eq(sessions.patientId, patientId),
      eq(sessions.programId, programId)
    ]

    if (dateFrom) conditions.push(gte(sessions.sessionDate, dateFrom))
    if (dateTo) conditions.push(lte(sessions.sessionDate, dateTo))

    return getDatabase()
      .select({
        id: sessions.id,
        sessionDate: sessions.sessionDate,
        painScore: sessions.painScore,
        generalFeeling: sessions.generalFeeling,
        perceivedImprovement: sessions.perceivedImprovement,
        muscleResponse: sessions.muscleResponse,
        patientTolerance: sessions.patientTolerance
      })
      .from(sessions)
      .where(and(...conditions))
      .orderBy(asc(sessions.sessionDate), asc(sessions.id))
      .all()
  },

  create(data: SessionInput) {
    const now = new Date()
    return getDatabase()
      .insert(sessions)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning()
      .get()
  },

  update(id: number, data: SessionInput) {
    return getDatabase()
      .update(sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning()
      .get()
  },

  remove(id: number) {
    getDatabase().delete(sessions).where(eq(sessions.id, id)).run()
  },

  exists(id: number): boolean {
    return (
      getDatabase().select({ id: sessions.id }).from(sessions).where(eq(sessions.id, id)).get() !==
      undefined
    )
  }
}
