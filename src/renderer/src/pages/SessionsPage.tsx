import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { formatDate, patientDisplayName, type PatientRecord } from '@shared/patient'
import { programLabel, type Program } from '@shared/program'
import type { SessionFilters, SessionRecord } from '@shared/session'
import SessionFormModal from '../components/SessionFormModal'

/**
 * Design document section 6.8.
 *
 * Every saved session, filterable by patient, date range and program.
 * Unlike the patients list, this screen has filters.
 */

const score = (value: number | null): string => (value === null ? '—' : String(value))

export default function SessionsPage(): React.JSX.Element {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null)
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<SessionFilters>({
    patientId: null,
    programId: null,
    dateFrom: null,
    dateTo: null
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<SessionRecord | null>(null)

  const loadSessions = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      setSessions(await window.api.sessions.list(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sessions')
    }
  }, [filters])

  useEffect(() => {
    // Reference data for the dropdowns, loaded once.
    Promise.all([window.api.patients.list(), window.api.programs.list()])
      .then(([p, pr]) => {
        setPatients(p)
        setPrograms(pr)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load reference data')
      )
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: String(p.id), label: patientDisplayName(p) })),
    [patients]
  )

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: String(p.id), label: programLabel(p) })),
    [programs]
  )

  const hasFilters =
    filters.patientId !== null ||
    filters.programId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null

  const clearFilters = (): void =>
    setFilters({ patientId: null, programId: null, dateFrom: null, dateTo: null })

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Sessions</Title>
        <Button
          onClick={() => {
            setSelected(null)
            setModalOpen(true)
          }}
        >
          Add new session
        </Button>
      </Group>

      <Paper withBorder p="sm">
        <SimpleGrid cols={4} spacing="sm">
          <Select
            label="Patient"
            placeholder="All patients"
            clearable
            searchable
            data={patientOptions}
            value={filters.patientId === null ? null : String(filters.patientId)}
            onChange={(v) =>
              setFilters((f) => ({ ...f, patientId: v === null ? null : Number(v) }))
            }
          />
          <Select
            label="Program"
            placeholder="All programs"
            clearable
            data={programOptions}
            value={filters.programId === null ? null : String(filters.programId)}
            onChange={(v) =>
              setFilters((f) => ({ ...f, programId: v === null ? null : Number(v) }))
            }
          />
          <DateInput
            label="From"
            placeholder="Any date"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateFrom ?? null}
            onChange={(value) => setFilters((f) => ({ ...f, dateFrom: value }))}
          />
          <DateInput
            label="To"
            placeholder="Any date"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateTo ?? null}
            onChange={(value) => setFilters((f) => ({ ...f, dateTo: value }))}
          />
        </SimpleGrid>

        {hasFilters && (
          <Group mt="sm">
            <Button variant="subtle" size="compact-sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </Group>
        )}
      </Paper>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {sessions === null && !error && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {sessions !== null && sessions.length === 0 && (
        <Text c="dimmed" py="xl" ta="center">
          {hasFilters
            ? 'No sessions match these filters.'
            : 'No sessions yet. Add your first session to get started.'}
        </Text>
      )}

      {sessions !== null && sessions.length > 0 && (
        <Table highlightOnHover striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={70}>ID</Table.Th>
              <Table.Th>Patient</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Program</Table.Th>
              <Table.Th w={60}>Pain</Table.Th>
              <Table.Th w={70}>Feeling</Table.Th>
              <Table.Th w={90}>Improvement</Table.Th>
              <Table.Th w={80}>Response</Table.Th>
              <Table.Th w={80}>Tolerance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sessions.map((session) => (
              <Table.Tr
                key={session.id}
                onClick={() => {
                  setSelected(session)
                  setModalOpen(true)
                }}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>{session.id}</Table.Td>
                <Table.Td>
                  {patientDisplayName({
                    firstName: session.patientFirstName,
                    lastName: session.patientLastName
                  })}
                </Table.Td>
                <Table.Td>{formatDate(session.sessionDate)}</Table.Td>
                <Table.Td>{session.programName}</Table.Td>
                <Table.Td>{score(session.painScore)}</Table.Td>
                <Table.Td>{score(session.generalFeeling)}</Table.Td>
                <Table.Td>{score(session.perceivedImprovement)}</Table.Td>
                <Table.Td>{score(session.muscleResponse)}</Table.Td>
                <Table.Td>{score(session.patientTolerance)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <SessionFormModal
        opened={modalOpen}
        session={selected}
        patients={patients}
        programs={programs}
        onClose={() => setModalOpen(false)}
        onSaved={loadSessions}
      />
    </Stack>
  )
}
