import { sqliteTable, integer, text, check } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Stimel-03 schema. See Application Design Document section 3.
 *
 * Date columns hold calendar dates as 'YYYY-MM-DD' text. They are not
 * timestamps: a date of birth stored as a moment in time can shift by a
 * day across timezones, which is not acceptable in a clinical record.
 * createdAt and updatedAt are genuine moments and are stored as timestamps.
 *
 * Note on authentication: the password hash, recovery key hash and the two
 * wrapped copies of the database key are NOT stored here. They live in
 * auth.json outside the encrypted database, because they are required in
 * order to decrypt it. See src/main/auth/vault.ts.
 */

// ---------------------------------------------------------------------------
// users — exactly one row. Profile only; no authentication material.
// ---------------------------------------------------------------------------
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey(),

    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    medicalLicenseNumber: text('medical_license_number').notNull(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    state: text('state').notNull(),
    city: text('city').notNull(),
    fullAddress: text('full_address').notNull(),

    disclaimerAcceptedAt: integer('disclaimer_accepted_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    // The application is single-user by specification. Enforce it in the
    // database rather than trusting every future code path to remember.
    check('users_single_row', sql`${table.id} = 1`)
  ]
)

// ---------------------------------------------------------------------------
// programs — 11 fixed rows, seeded at first launch, never edited
// ---------------------------------------------------------------------------
export const programs = sqliteTable('programs', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  shortDescription: text('short_description').notNull(),

  // Nullable: the specification supplies these only for the four Motor
  // programs. See design document open question 9.1.
  biofeedback: text('biofeedback'),
  treatmentDuration: text('treatment_duration'),

  pausePacketRatio: integer('pause_packet_ratio').notNull(),
  packetDuration: text('packet_duration').notNull(),
  dose: text('dose').notNull(),
  note: text('note')
})

// ---------------------------------------------------------------------------
// patients
// ---------------------------------------------------------------------------
export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Every patient field is optional by specification (design doc 3.2).
  firstName: text('first_name'),
  lastName: text('last_name'),

  // Age is derived from this at display time and never stored.
  dateOfBirth: text('date_of_birth'),

  gender: text('gender'),
  phoneNumber: text('phone_number'),
  email: text('email'),
  address: text('address'),

  clinicalDiagnosis: text('clinical_diagnosis'),
  affectedSide: text('affected_side'),
  sensoryStatus: integer('sensory_status'),
  muscleTone: integer('muscle_tone'),
  startDate: text('start_date'),
  emergencyContact: text('emergency_contact'),
  notes: text('notes'),

  status: text('status').notNull().default('Active'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------
export const sessions = sqliteTable('sessions', {
  // AUTOINCREMENT, not a plain integer key. SQLite reuses ids from deleted
  // rows otherwise, and design doc 3.3 requires session ids to be permanent
  // and never reused.
  id: integer('id').primaryKey({ autoIncrement: true }),

  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),

  programId: integer('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'restrict' }),

  sessionDate: text('session_date'),
  treatmentDurationMin: text('treatment_duration_min'),
  biofeedback: text('biofeedback'),
  affectedSide: text('affected_side'),

  // These five must stay nullable and must be stored as null when not
  // entered. Design doc 6.11: a session with no value for a metric is
  // skipped in that graph. A default of 0 would corrupt every report,
  // because 0 sits below the bottom of every scale.
  painScore: integer('pain_score'),
  generalFeeling: integer('general_feeling'),
  perceivedImprovement: integer('perceived_improvement'),
  muscleResponse: integer('muscle_response'),
  patientTolerance: integer('patient_tolerance'),

  notes: text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Program = typeof programs.$inferSelect
