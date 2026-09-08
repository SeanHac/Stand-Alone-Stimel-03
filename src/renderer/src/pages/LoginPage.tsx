import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
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
 * email login. One therapist, one machine.
 */
export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
          Stimel 0-3 treatment documentation
        </Text>
      </div>

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

      <Button onClick={handleSubmit} loading={busy} fullWidth mt="xs">
        Sign in
      </Button>
    </Stack>
  )
}
