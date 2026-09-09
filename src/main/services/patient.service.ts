import { patientRepository } from '../repositories/patient.repository'
import { parsePatient } from '../validation/patient.schema'
import type { PatientInput, PatientRecord } from '@shared/patient'
import type { Patient } from '../db/schema'

/**
 * Business rules for patients. Validation beyond field types, and the
 * translation between stored rows and what the interface receives.
 */

/**
 * Timestamps cross the process boundary as ISO strings. Date objects do not
 * survive structured cloning intact across every Electron version, and the
 * interface only ever displays them.
 */
function toRecord(row: Patient): PatientRecord {
  return {
    ...row,
    gender: row.gender as PatientRecord['gender'],
    affectedSide: row.affectedSide as PatientRecord['affectedSide'],
    status: row.status as PatientRecord['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export const patientService = {
  list(): PatientRecord[] {
    return patientRepository.findAll().map(toRecord)
  },

  listActive(): PatientRecord[] {
    return patientRepository.findActive().map(toRecord)
  },

  get(id: number): PatientRecord | null {
    const row = patientRepository.findById(id)
    return row ? toRecord(row) : null
  },

  create(input: unknown): PatientRecord {
    const data: PatientInput = parsePatient(input)
    return toRecord(patientRepository.create(data))
  },

  update(id: number, input: unknown): PatientRecord {
    const data: PatientInput = parsePatient(input)

    if (!patientRepository.findById(id)) {
      throw new Error('That patient no longer exists')
    }

    return toRecord(patientRepository.update(id, data))
  },

  remove(id: number): void {
    if (!patientRepository.findById(id)) {
      throw new Error('That patient no longer exists')
    }
    patientRepository.remove(id)
  }
}
