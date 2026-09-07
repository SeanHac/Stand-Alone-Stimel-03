import { sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { programs } from './schema'
import type * as schema from './schema'

/**
 * The eleven treatment programs, from Product Specification 16.1 and 17.3.
 *
 * Reference data. There is no interface path to create, edit, delete or
 * deactivate a program, so this runs once at first launch and then never
 * changes for the life of the installation.
 *
 * biofeedback and treatmentDuration are null for the seven Biofeedback and
 * Sensory programs: the specification lists those columns in the Programs
 * table but supplies values only for the four Motor programs. See design
 * document open question 9.1 — this is visible to the therapist and should
 * be resolved with the product owner before release.
 */
const PROGRAM_SEED = [
  {
    id: 1,
    name: 'Biofeedback 1',
    shortDescription: 'Standard treatment program',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '2 sec',
    dose: '60 µs',
    note: 'Default program for stroke rehabilitation.'
  },
  {
    id: 2,
    name: 'Biofeedback 2',
    shortDescription: 'Standard treatment program+',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '2 sec',
    dose: '120 µs',
    note: null
  },
  {
    id: 3,
    name: 'Biofeedback 3',
    shortDescription: 'Standard treatment program++',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '2 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 4,
    name: 'Sensitive',
    shortDescription: 'High pain/muscle tone program',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '10 sec',
    dose: '60 µs',
    note: null
  },
  {
    id: 5,
    name: 'Low Sensory 1',
    shortDescription: 'Moderate sensory impairment',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '6 sec',
    dose: '120 µs',
    note: null
  },
  {
    id: 6,
    name: 'Low Sensory 2',
    shortDescription: 'Major sensory impairment',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '6 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 7,
    name: 'Sensory/High Tone',
    shortDescription: 'High muscle tone + sensory impairment',
    biofeedback: null,
    treatmentDuration: null,
    pausePacketRatio: 1,
    packetDuration: '10 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 8,
    name: 'Motor UE 1',
    shortDescription: 'Wrist/finger extensors mild',
    biofeedback: 'Off',
    treatmentDuration: '30 min',
    pausePacketRatio: 3,
    packetDuration: '10 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 9,
    name: 'Motor UE 2',
    shortDescription: 'Wrist/finger extensors severe',
    biofeedback: 'Off',
    treatmentDuration: '30 min',
    pausePacketRatio: 5,
    packetDuration: '10 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 10,
    name: 'Motor LE 1',
    shortDescription: 'Drop foot mild',
    biofeedback: 'Off',
    treatmentDuration: '30 min',
    pausePacketRatio: 2,
    packetDuration: '5 sec',
    dose: '300 µs',
    note: null
  },
  {
    id: 11,
    name: 'Motor LE 2',
    shortDescription: 'Drop foot severe',
    biofeedback: 'Off',
    treatmentDuration: '30 min',
    pausePacketRatio: 3,
    packetDuration: '10 sec',
    dose: '300 µs',
    note: null
  }
] as const

/**
 * Writes the program reference data. Safe to call on every startup:
 * existing rows are left untouched.
 */
export function seedPrograms(db: BetterSQLite3Database<typeof schema>): void {
  const existing = db.select({ id: programs.id }).from(programs).all()
  if (existing.length > 0) return

  db.insert(programs).values(PROGRAM_SEED.map((p) => ({ ...p }))).run()
}
