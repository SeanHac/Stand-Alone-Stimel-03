import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Alert, Button, Checkbox, Code, CopyButton, Group, Stack, Text, Title } from '@mantine/core'

/**
 * Design document section 6.3. Shown exactly once, immediately after the
 * account is created. Only the hash is retained, so it can never be
 * displayed again.
 */
export default function RecoveryKeyPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmed, setConfirmed] = useState(false)

  const recoveryKey = (location.state as { recoveryKey?: string } | null)?.recoveryKey

  // Reaching this screen without a key means a refresh or a direct
  // navigation. There is nothing to show and nothing to recover.
  if (!recoveryKey) {
    return <Navigate to="/patients" replace />
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Your recovery key</Title>
        <Text c="dimmed" size="sm">
          This is the only time it will be shown.
        </Text>
      </div>

      <Code block fz="md" ta="center" p="md">
        {recoveryKey}
      </Code>

      <Group justify="center">
        <CopyButton value={recoveryKey}>
          {({ copied, copy }) => (
            <Button variant="light" onClick={copy}>
              {copied ? 'Copied' : 'Copy to clipboard'}
            </Button>
          )}
        </CopyButton>
      </Group>

      <Alert color="yellow" variant="light" title="Keep this somewhere safe">
        <Text size="sm">
          Your password is not stored by Motion Informatics and cannot be recovered. This key
          is the only way to reset it.
        </Text>
        <Text size="sm" mt="xs">
          There is no email or server-based recovery. If you lose both your password and this
          key, the data on this computer cannot be recovered by anyone.
        </Text>
      </Alert>

      <Checkbox
        checked={confirmed}
        onChange={(e) => setConfirmed(e.currentTarget.checked)}
        label="I have saved my Recovery Key"
      />

      <Button
        disabled={!confirmed}
        onClick={() => navigate('/patients', { replace: true })}
        fullWidth
      >
        Continue
      </Button>
    </Stack>
  )
}
