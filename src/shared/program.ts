/**
 * Program reference data as returned to the interface.
 *
 * Programs are seeded at first launch and never change: there is no
 * interface path to create, edit, delete or deactivate one.
 * See Application Design Document section 3.4.
 */
export interface Program {
  id: number
  name: string
  shortDescription: string
  biofeedback: string | null
  treatmentDuration: string | null
  pausePacketRatio: number
  packetDuration: string
  dose: string
  note: string | null
}

/** Label used in the session form dropdown: name plus short description. */
export function programLabel(program: Program): string {
  return `${program.name} — ${program.shortDescription}`
}
