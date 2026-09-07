import { Stack, Title, Text } from '@mantine/core'
 
export default function ReportsPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={2}>Reports</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.11. Five trend graphs for a chosen patient and program, with PDF export.
      </Text>
    </Stack>
  )
}