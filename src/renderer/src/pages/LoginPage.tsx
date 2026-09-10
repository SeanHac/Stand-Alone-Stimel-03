import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { AlertIcon, LockIcon, UserIcon } from '../components/icons'

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
      setError(err instanceof Error ? err.message : 'Incorrect username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="lg">
      <Stack gap={2} align="center">
        <Title order={3} className="auth-heading">
          Welcome Back
        </Title>
        <Text className="auth-subheading">Sign in to continue</Text>
      </Stack>

      <Paper className="auth-panel" p="lg">
        <Stack gap="sm">
          {notice && (
            <Alert color="green" variant="light" p="xs">
              <Text size="xs">{notice}</Text>
            </Alert>
          )}

          <TextInput
            placeholder="Username"
            leftSection={<UserIcon />}
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            size="md"
            autoFocus
          />

          <PasswordInput
            placeholder="Password"
            leftSection={<LockIcon />}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            size="md"
          />

          <Button
            onClick={handleSubmit}
            loading={busy}
            size="md"
            fullWidth
            mt={4}
            variant="gradient"
            gradient={{ from: 'brand.5', to: 'brand.8', deg: 100 }}
          >
            Sign In
          </Button>

          {error && (
            <Group gap={6} wrap="nowrap" align="center" c="red.7" mt={2}>
              <AlertIcon />
              <Text size="sm" c="red.7">
                {error}
              </Text>
            </Group>
          )}
        </Stack>
      </Paper>

      <Anchor
        component="button"
        type="button"
        size="xs"
        c="dimmed"
        ta="center"
        onClick={() => navigate('/welcome')}
      >
        Back
      </Anchor>
    </Stack>
  )
}
