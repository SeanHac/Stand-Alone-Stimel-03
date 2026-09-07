import { Stack, Title, Text } from '@mantine/core'

export default function CreateUserPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={3}>Create your account</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.2. Nine required fields plus the disclaimer checkbox.
      </Text>
    </Stack>
  )
}