import { useMemo, useState } from 'react'
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { formatDate, patientDisplayName } from '@shared/patient'
import { programLabel } from '@shared/program'
import type { SessionFilters, SessionRecord } from '@shared/session'
import { useData } from '../data/DataContext'
import SessionFormModal from '../components/SessionFormModal'
import { InfoIcon, PlusIcon } from '../components/icons'

/**
 * Design document section 6.8.
 *
 * Every saved session, filterable by patient, date range and program.
 * Filtering happens in memory: the sessions are already loaded, so changing
 * a filter redraws immediately with no round trip to the database.
 */

const score = (value: number | null): string => (value === null ? '—' : String(value))

export default function SessionsPage(): React.JSX.Element {
  const { sessions, patients, programs } = useData()

  const [filters, setFilters] = useState<SessionFilters>({
    patientId: null,
    programId: null,
    dateFrom: null,
    dateTo: null
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<SessionRecord | null>(null)

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: String(p.id), label: patientDisplayName(p) })),
    [patients]
  )

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: String(p.id), label: programLabel(p) })),
    [programs]
  )

  const visible = useMemo(() => {
    return sessions.filter((s) => {
      if (filters.patientId && s.patientId !== filters.patientId) return false
      if (filters.programId && s.programId !== filters.programId) return false
      // Dates are stored as YYYY-MM-DD, which sorts chronologically, so a
      // plain string comparison is a date comparison.
      if (filters.dateFrom && (s.sessionDate ?? '') < filters.dateFrom) return false
      if (filters.dateTo && (s.sessionDate ?? '') > filters.dateTo) return false
      return true
    })
  }, [sessions, filters])

  const hasFilters =
    filters.patientId !== null ||
    filters.programId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null

  const clearFilters = (): void =>
    setFilters({ patientId: null, programId: null, dateFrom: null, dateTo: null })

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>Sessions</Title>
          <Text className="page-subtitle">Manage all treatment sessions</Text>
        </Stack>
        <Button
          leftSection={<PlusIcon />}
          onClick={() => {
            setSelected(null)
            setModalOpen(true)
          }}
        >
          Add New Session
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

      {visible.length === 0 ? (
        <Paper withBorder p="xl">
          <Text c="dimmed" ta="center">
            {hasFilters
              ? 'No sessions match these filters.'
              : 'No sessions yet. Add your first session to get started.'}
          </Text>
        </Paper>
      ) : (
        <>
          <Paper withBorder>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={60}>ID</Table.Th>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Program</Table.Th>
                  <Table.Th w={60}>Pain</Table.Th>
                  <Table.Th w={70}>Feeling</Table.Th>
                  <Table.Th w={100}>Improvement</Table.Th>
                  <Table.Th w={85}>Response</Table.Th>
                  <Table.Th w={85}>Tolerance</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visible.map((session) => (
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

            <Group
              px="md"
              py="sm"
              style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
            >
              <Text size="sm" c="dimmed">
                {hasFilters
                  ? `Showing ${visible.length} of ${sessions.length} sessions`
                  : `Total Sessions: ${sessions.length}`}
              </Text>
            </Group>
          </Paper>

          <Paper withBorder p="sm" bg="var(--mantine-color-gray-0)">
            <Group gap={8} wrap="nowrap" c="dimmed">
              <InfoIcon />
              <Text size="sm" c="dimmed">
                Select a session row to view or edit its details.
              </Text>
            </Group>
          </Paper>
        </>
      )}

      <SessionFormModal
        opened={modalOpen}
        session={selected}
        onClose={() => setModalOpen(false)}
      />
    </Stack>
  )
}
