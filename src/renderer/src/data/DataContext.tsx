import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { Center, Loader, Stack, Text, Alert } from '@mantine/core'
import type { PatientRecord } from '@shared/patient'
import type { SessionRecord } from '@shared/session'
import type { Program } from '@shared/program'
import { toMessage } from '@shared/errors'

/**
 * In-memory store for everything the application shows.
 *
 * Loaded once when the main layout mounts — that is, immediately after
 * authentication — and held for the life of the session. Screens read from
 * here rather than querying on mount, so navigation is instant and no
 * screen waits on the database.
 *
 * This is affordable because the data is small: one therapist's patients
 * and sessions, plus eleven fixed programs. It would not be affordable for
 * a multi-user system, and the assumption is worth revisiting if the
 * specification ever changes.
 *
 * Writes go to the database first and update this store only on success, so
 * the interface never shows a record that failed to save.
 */

interface DataState {
  patients: PatientRecord[]
  sessions: SessionRecord[]
  programs: Program[]

  /** Re-reads everything. Rarely needed; mutations keep the store current. */
  reloadAll: () => Promise<void>

  createPatient: (input: unknown) => Promise<PatientRecord>
  updatePatient: (id: number, input: unknown) => Promise<PatientRecord>
  deletePatient: (id: number) => Promise<void>

  createSession: (input: unknown) => Promise<SessionRecord>
  updateSession: (id: number, input: unknown) => Promise<SessionRecord>
  deleteSession: (id: number) => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

export function useData(): DataState {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}

export function DataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reloadAll = useCallback(async (): Promise<void> => {
    // One round trip per table, in parallel. Programs never change after
    // seeding, but they are cheap and this keeps the load path uniform.
    const [p, s, pr] = await Promise.all([
      window.api.patients.list(),
      window.api.sessions.list({}),
      window.api.programs.list()
    ])
    setPatients(p)
    setSessions(s)
    setPrograms(pr)
  }, [])

  useEffect(() => {
    let cancelled = false

    reloadAll()
      .catch((err) => {
        if (!cancelled) setError(toMessage(err, 'Could not load your records'))
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [reloadAll])

  // ---- Patients ---------------------------------------------------------

  const createPatient = useCallback(async (input: unknown): Promise<PatientRecord> => {
    const created = await window.api.patients.create(input)
    setPatients((current) => [created, ...current])
    return created
  }, [])

  const updatePatient = useCallback(
    async (id: number, input: unknown): Promise<PatientRecord> => {
      const updated = await window.api.patients.update(id, input)
      setPatients((current) => current.map((p) => (p.id === id ? updated : p)))

      // A patient's name appears on every session row, so those cached
      // rows are now stale.
      setSessions((current) =>
        current.map((s) =>
          s.patientId === id
            ? { ...s, patientFirstName: updated.firstName, patientLastName: updated.lastName }
            : s
        )
      )
      return updated
    },
    []
  )

  const deletePatient = useCallback(async (id: number): Promise<void> => {
    await window.api.patients.remove(id)
    setPatients((current) => current.filter((p) => p.id !== id))

    // The database cascades the delete to sessions; mirror that here rather
    // than re-reading the table.
    setSessions((current) => current.filter((s) => s.patientId !== id))
  }, [])

  // ---- Sessions ---------------------------------------------------------

  const createSession = useCallback(async (input: unknown): Promise<SessionRecord> => {
    const created = await window.api.sessions.create(input)
    setSessions((current) => [created, ...current])
    return created
  }, [])

  const updateSession = useCallback(
    async (id: number, input: unknown): Promise<SessionRecord> => {
      const updated = await window.api.sessions.update(id, input)
      setSessions((current) => current.map((s) => (s.id === id ? updated : s)))
      return updated
    },
    []
  )

  const deleteSession = useCallback(async (id: number): Promise<void> => {
    await window.api.sessions.remove(id)
    setSessions((current) => current.filter((s) => s.id !== id))
  }, [])

  const value = useMemo<DataState>(
    () => ({
      patients,
      sessions,
      programs,
      reloadAll,
      createPatient,
      updatePatient,
      deletePatient,
      createSession,
      updateSession,
      deleteSession
    }),
    [
      patients,
      sessions,
      programs,
      reloadAll,
      createPatient,
      updatePatient,
      deletePatient,
      createSession,
      updateSession,
      deleteSession
    ]
  )

  if (!ready) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="sm">
          <Loader />
          <Text size="sm" c="dimmed">
            Loading your records
          </Text>
        </Stack>
      </Center>
    )
  }

  if (error) {
    return (
      <Center mih="60vh" p="xl">
        <Alert color="red" title="Could not load your records" maw={460}>
          {error}
        </Alert>
      </Center>
    )
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
