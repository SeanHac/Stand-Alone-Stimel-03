import { Stack, Title, Text } from '@mantine/core'
 
export default function PatientsPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={2}>Patients</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.6. Table of all patients with an add action. No search or filter.
      </Text>
    </Stack>
  )
}
 