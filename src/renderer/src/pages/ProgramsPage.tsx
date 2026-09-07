import { Stack, Title, Text } from '@mantine/core'

export default function ProgramsPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={2}>Programs</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.10. Read-only reference table of the eleven programs, with a details side panel.
      </Text>
    </Stack>
  )
}