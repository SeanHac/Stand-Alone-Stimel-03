import { useState } from 'react'
import { Badge, Button, Group, Paper, Stack, Table, Text, Title } from '@mantine/core'
import { formatDate, type PatientRecord } from '@shared/patient'
import { useData } from '../data/DataContext'
import PatientFormModal from '../components/PatientFormModal'
import { InfoIcon, PlusIcon } from '../components/icons'

/**
 * Design document section 6.6.
 *
 * Reads from the in-memory store rather than querying on mount, so the
 * screen renders immediately when navigated to.
 */
export default function PatientsPage(): React.JSX.Element {
  const { patients } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<PatientRecord | null>(null)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>Patients</Title>
          <Text className="page-subtitle">Manage all patients</Text>
        </Stack>
        <Button
          leftSection={<PlusIcon />}
          onClick={() => {
            setSelected(null)
            setModalOpen(true)
          }}
        >
          Add New Patient
        </Button>
      </Group>

      {patients.length === 0 ? (
        <Paper withBorder p="xl">
          <Text c="dimmed" ta="center">
            No patients yet. Add your first patient to get started.
          </Text>
        </Paper>
      ) : (
        <>
          <Paper withBorder>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>First Name</Table.Th>
                  <Table.Th>Last Name</Table.Th>
                  <Table.Th>Clinical Diagnosis</Table.Th>
                  <Table.Th>Affected Side</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th w={110}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {patients.map((patient) => (
                  <Table.Tr
                    key={patient.id}
                    onClick={() => {
                      setSelected(patient)
                      setModalOpen(true)
                    }}
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
                        radius="sm"
                        color={patient.status === 'Active' ? 'green' : 'gray'}
                      >
                        {patient.status}
                      </Badge>
                    </Table.Td>
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
                Total Patients: {patients.length}
              </Text>
            </Group>
          </Paper>

          <Paper withBorder p="sm" bg="var(--mantine-color-gray-0)">
            <Group gap={8} wrap="nowrap" c="dimmed">
              <InfoIcon />
              <Text size="sm" c="dimmed">
                Select a patient row to view or edit patient details.
              </Text>
            </Group>
          </Paper>
        </>
      )}

      <PatientFormModal
        opened={modalOpen}
        patient={selected}
        onClose={() => setModalOpen(false)}
      />
    </Stack>
  )
}
