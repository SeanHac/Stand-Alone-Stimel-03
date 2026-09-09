import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'

/**
 * Design document section 6.5.
 *
 * No account creation, no user switching, no forgot-password link, no
 * email login. Recovery is reached from the welcome screen instead.
 */
export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Set after a successful password reset.
  const notice = (location.state as { notice?: string } | null)?.notice

  const handleSubmit = async (): Promise<void> => {
    setError(null)
    setBusy(true)
    try {
      await window.api.auth.login(username, password)
      navigate('/patients', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect username or password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Sign in</Title>
        <Text c="dimmed" size="sm">
          Stimel-03 treatment documentation
        </Text>
      </div>

      {notice && (
        <Alert color="green" variant="light">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      <TextInput
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />

      <Group justify="space-between" mt="xs">
        <Button variant="subtle" onClick={() => navigate('/welcome')}>
          Back
        </Button>
        <Button onClick={handleSubmit} loading={busy}>
          Sign in
        </Button>
      </Group>
    </Stack>
  )
}
