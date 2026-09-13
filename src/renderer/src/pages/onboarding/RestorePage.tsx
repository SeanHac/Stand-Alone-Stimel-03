import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Group, Paper, Stack, Text, Title } from '@mantine/core'

/**
 * Design document section 6.4.
 *
 * Restore replaces all local data; it never merges. Two installations both
 * number their patients from 1, so merging would collide.
 *
 * After a successful restore the therapist signs in with the username and
 * password from the original installation — the backup carries the wrapped
 * database keys with it, so the same password unlocks the restored data.
 */

interface Chosen {
  filePath: string
  createdAt: string
  appVersion: string
  hasExistingData: boolean
}

export default function RestorePage(): React.JSX.Element {
  const navigate = useNavigate()
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleChoose = async (): Promise<void> => {
    setError(null)
    try {
      const result = await window.api.backup.choose()
      if (!result.ok) return

      setChosen({
        filePath: result.filePath!,
        createdAt: result.createdAt!,
        appVersion: result.appVersion!,
        hasExistingData: result.hasExistingData!
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file could not be read')
    }
  }

  const handleRestore = async (): Promise<void> => {
    if (!chosen) return
    setBusy(true)
    setError(null)
    try {
      await window.api.backup.restore(chosen.filePath)
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Backup restored. Sign in with the username and password from that installation.'
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The backup could not be restored')
      setBusy(false)
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={2} align="center">
        <Title order={3} className="auth-heading">
          Restore from Backup
        </Title>
        <Text className="auth-subheading">Bring your records onto this computer</Text>
      </Stack>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {chosen === null ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Select the backup file you saved from your previous installation. It will
            contain your profile, patients, sessions and settings.
          </Text>
          <Button onClick={handleChoose} fullWidth>
            Select backup file
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">
              Selected backup
            </Text>
            <Text size="sm" fw={600} style={{ wordBreak: 'break-all' }}>
              {chosen.filePath.split('/').pop()}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Created {new Date(chosen.createdAt).toLocaleString()} · version{' '}
              {chosen.appVersion}
            </Text>
          </Paper>

          {chosen.hasExistingData && (
            <Alert color="red" variant="light" title="This will replace existing data">
              <Text size="sm">
                This computer already holds an account and its records. Restoring will
                permanently replace all of it with the contents of the backup.
              </Text>
              <Text size="sm" fw={600} mt="xs">
                This action cannot be undone.
              </Text>
            </Alert>
          )}

          <Group grow>
            <Button variant="default" onClick={() => setChosen(null)} disabled={busy}>
              Choose a different file
            </Button>
            <Button
              color={chosen.hasExistingData ? 'red' : undefined}
              onClick={handleRestore}
              loading={busy}
            >
              {chosen.hasExistingData ? 'Replace and restore' : 'Restore'}
            </Button>
          </Group>
        </Stack>
      )}

      <Button variant="subtle" size="compact-sm" onClick={() => navigate(-1)}>
        Back
      </Button>
    </Stack>
  )
}
