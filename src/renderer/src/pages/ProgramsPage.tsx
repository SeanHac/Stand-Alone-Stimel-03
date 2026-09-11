import { useEffect, useState } from 'react'
import {
  Alert,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core'
import type { Program } from '@shared/program'

/**
 * Design document section 6.10.
 *
 * A read-only reference screen. The therapist cannot create, edit, delete,
 * activate or deactivate anything here, and there is no search or filter.
 * The eleven programs are seeded at first launch and never change.
 */

const dash = (value: string | null): string => value ?? '—'

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
      <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="sm" fw={500} ta="right">
        {value}
      </Text>
    </Group>
  )
}

export default function ProgramsPage(): React.JSX.Element {
  const [programs, setPrograms] = useState<Program[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Program | null>(null)

  useEffect(() => {
    window.api.programs
      .list()
      .then(setPrograms)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load programs')
      )
  }, [])

  return (
    <Stack gap="md">
      <Title order={2}>Programs</Title>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {programs === null && !error && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {programs !== null && (
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Table highlightOnHover striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={50}>ID</Table.Th>
                  <Table.Th>Program name</Table.Th>
                  <Table.Th w={100}>Biofeedback</Table.Th>
                  <Table.Th w={110}>Duration</Table.Th>
                  <Table.Th w={80}>Ratio</Table.Th>
                  <Table.Th w={90}>Packet</Table.Th>
                  <Table.Th w={80}>Dose</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {programs.map((program) => (
                  <Table.Tr
                    key={program.id}
                    onClick={() => setSelected(program)}
                    style={{ cursor: 'pointer' }}
                    bg={
                      selected?.id === program.id
                        ? 'var(--mantine-color-brand-0)'
                        : undefined
                    }
                  >
                    <Table.Td>{program.id}</Table.Td>
                    <Table.Td>{program.name}</Table.Td>
                    <Table.Td>{dash(program.biofeedback)}</Table.Td>
                    <Table.Td>{dash(program.treatmentDuration)}</Table.Td>
                    <Table.Td>{program.pausePacketRatio}</Table.Td>
                    <Table.Td>{program.packetDuration}</Table.Td>
                    <Table.Td>{program.dose}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" h="100%">
              {selected === null ? (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                  Select a program to see its full parameters.
                </Text>
              ) : (
                <Stack gap="sm">
                  <div>
                    <Title order={4}>{selected.name}</Title>
                    <Text c="dimmed" size="sm">
                      {selected.shortDescription}
                    </Text>
                  </div>

                  <Stack gap={8}>
                    <DetailRow label="Program ID" value={String(selected.id)} />
                    <DetailRow label="Biofeedback" value={dash(selected.biofeedback)} />
                    <DetailRow
                      label="Treatment duration"
                      value={dash(selected.treatmentDuration)}
                    />
                    <DetailRow
                      label="Pause / packet ratio"
                      value={String(selected.pausePacketRatio)}
                    />
                    <DetailRow label="Packet duration" value={selected.packetDuration} />
                    <DetailRow label="Dose" value={selected.dose} />
                  </Stack>

                  {selected.note && (
                    <Paper bg="var(--mantine-color-gray-0)" p="sm" radius="sm">
                      <Text size="sm">{selected.note}</Text>
                    </Paper>
                  )}
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      <Text c="dimmed" size="xs">
        Programs are fixed reference data and cannot be changed.
      </Text>
    </Stack>
  )
}
