import { sessionRepository } from '../repositories/session.repository'
import { patientRepository } from '../repositories/patient.repository'
import { parseSession } from '../validation/session.schema'
import type { SessionFilters, SessionInput, SessionRecord } from '@shared/session'

/**
 * Business rules for sessions.
 *
 * Session ids are assigned by SQLite's AUTOINCREMENT and are permanent:
 * never edited, never reused after a deletion. Design document 3.3.
 */

type Row = ReturnType<typeof sessionRepository.findById>

function toRecord(row: NonNullable<Row>): SessionRecord {
  return {
    ...row,
    biofeedback: row.biofeedback as SessionRecord['biofeedback'],
    affectedSide: row.affectedSide as SessionRecord['affectedSide'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export const sessionService = {
  list(filters: SessionFilters = {}): SessionRecord[] {
    return sessionRepository.findAll(filters).map(toRecord)
  },

  get(id: number): SessionRecord | null {
    const row = sessionRepository.findById(id)
    return row ? toRecord(row) : null
  },

  create(input: unknown): SessionRecord {
    const data: SessionInput = parseSession(input)

    const patient = patientRepository.findById(data.patientId)
    if (!patient) throw new Error('That patient no longer exists')

    // Design document 6.9: only Active patients appear when creating a
    // session. Enforced here rather than only in the dropdown, because the
    // renderer is not trusted.
    if (patient.status !== 'Active') {
      throw new Error('Sessions can only be created for active patients')
    }

    const created = sessionRepository.create(data)
    return toRecord(sessionRepository.findById(created.id)!)
  },

  update(id: number, input: unknown): SessionRecord {
    const data: SessionInput = parseSession(input)

    if (!sessionRepository.exists(id)) {
      throw new Error('That session no longer exists')
    }

    // An existing session belonging to a patient who has since been set
    // Inactive remains fully editable. The Active restriction applies only
    // to creating new sessions.
    if (!patientRepository.findById(data.patientId)) {
      throw new Error('That patient no longer exists')
    }

    sessionRepository.update(id, data)
    return toRecord(sessionRepository.findById(id)!)
  },

  remove(id: number): void {
    if (!sessionRepository.exists(id)) {
      throw new Error('That session no longer exists')
    }
    sessionRepository.remove(id)
  }
}
