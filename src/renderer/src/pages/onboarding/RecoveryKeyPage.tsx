import { Stack, Title, Text } from '@mantine/core'

export default function RecoveryKeyPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={3}>Your recovery key</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.3. Shown exactly once. Must be confirmed as saved before continuing.
      </Text>
    </Stack>
  )
}