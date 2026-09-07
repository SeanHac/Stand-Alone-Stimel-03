import { Stack, Title, Text } from '@mantine/core'

export default function RestorePage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={3}>Restore from backup</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.4. Replaces all local data. Never merges.
      </Text>
    </Stack>
  )
}