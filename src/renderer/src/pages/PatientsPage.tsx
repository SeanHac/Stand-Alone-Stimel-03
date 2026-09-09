import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core'
import { formatDate, type PatientRecord } from '@shared/patient'
import PatientFormModal from '../components/PatientFormModal'

/**
 * Design document section 6.6.
 *
 * A plain table of every patient, with no search or filter — that is
 * deliberate, not an omission. Inactive patients remain listed alongside
 * active ones. The patient id exists to distinguish identical names but is
 * not shown.
 */

export default function PatientsPage(): React.JSX.Element {
  const [patients, setPatients] = useState<PatientRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<PatientRecord | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      setPatients(await window.api.patients.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load patients')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = (): void => {
    setSelected(null)
    setModalOpen(true)
  }

  const openExisting = (patient: PatientRecord): void => {
    setSelected(patient)
    setModalOpen(true)
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Patients</Title>
        <Button onClick={openNew}>Add new patient</Button>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {patients === null && !error && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {patients !== null && patients.length === 0 && (
        <Text c="dimmed" py="xl" ta="center">
          No patients yet. Add your first patient to get started.
        </Text>
      )}

      {patients !== null && patients.length > 0 && (
        <Table highlightOnHover striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>First name</Table.Th>
              <Table.Th>Last name</Table.Th>
              <Table.Th>Clinical diagnosis</Table.Th>
              <Table.Th>Affected side</Table.Th>
              <Table.Th>Start date</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {patients.map((patient) => (
              <Table.Tr
                key={patient.id}
                onClick={() => openExisting(patient)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>{patient.firstName ?? '—'}</Table.Td>
                <Table.Td>{patient.lastName ?? '—'}</Table.Td>
                <Table.Td>{patient.clinicalDiagnosis ?? '—'}</Table.Td>
                <Table.Td>{patient.affectedSide ?? '—'}</Table.Td>
                <Table.Td>{formatDate(patient.startDate)}</Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={patient.status === 'Active' ? 'green' : 'gray'}
                  >
                    {patient.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <PatientFormModal
        opened={modalOpen}
        patient={selected}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </Stack>
  )
}
