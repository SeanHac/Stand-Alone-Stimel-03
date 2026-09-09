import { desc, eq } from 'drizzle-orm'
import { getDatabase } from '../db'
import { patients } from '../db/schema'
import type { PatientInput } from '@shared/patient'

/**
 * Data access for patients. Queries only — no business rules, no interface
 * concerns. See Application Design Document section 3.2.
 */

export const patientRepository = {
  findAll() {
    return getDatabase().select().from(patients).orderBy(desc(patients.updatedAt)).all()
  },

  /** Active patients only, for the new-session dropdown (design doc 6.9). */
  findActive() {
    return getDatabase()
      .select()
      .from(patients)
      .where(eq(patients.status, 'Active'))
      .all()
  },

  findById(id: number) {
    return getDatabase().select().from(patients).where(eq(patients.id, id)).get() ?? null
  },

  create(data: PatientInput) {
    const now = new Date()
    return getDatabase()
      .insert(patients)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning()
      .get()
  },

  update(id: number, data: PatientInput) {
    return getDatabase()
      .update(patients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning()
      .get()
  },

  /**
   * Permanent delete. Sessions are removed with the patient by the
   * ON DELETE CASCADE on sessions.patient_id — which only takes effect
   * because foreign_keys is enabled on the connection.
   */
  remove(id: number) {
    getDatabase().delete(patients).where(eq(patients.id, id)).run()
  }
}
