import { Stack, Title, Text } from '@mantine/core'

export default function SessionsPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={2}>Sessions</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.8. Table of all sessions, filterable by patient, date range and program.
      </Text>
    </Stack>
  )
}