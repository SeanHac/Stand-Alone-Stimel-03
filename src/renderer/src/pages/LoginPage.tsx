import { Stack, Title, Text } from '@mantine/core'
 
export default function LoginPage(): React.JSX.Element {
  return (
    <Stack gap="xs">
      <Title order={3}>Sign in</Title>
      <Text c="dimmed" size="sm">
        Design document section 6.5. Username and password only. No account creation, no forgot-password link.
      </Text>
    </Stack>
  )
}
 