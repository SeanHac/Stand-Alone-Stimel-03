import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { recoverySchema } from '@shared/auth'

/**
 * Account recovery. See Application Design Document section 4.2.
 *
 * The recovery key unwraps the database key, which is then re-wrapped under
 * the new password. The database itself is never re-encrypted and no data
 * is touched — only the wrapped key is rewritten.
 *
 * The recovery key resets a password. It is not accepted as a credential:
 * a successful reset returns to the login screen.
 */
export default function RecoveryPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [values, setValues] = useState({
    recoveryKey: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof values, value: string): void => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handleSubmit = async (): Promise<void> => {
    setFormError(null)

    const parsed = recoverySchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setBusy(true)
    try {
      await window.api.auth.resetPassword(parsed.data.recoveryKey, parsed.data.newPassword)
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password has been reset. Sign in with the new password.' }
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'That recovery key is not valid')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Account recovery</Title>
        <Text c="dimmed" size="sm">
          Enter the recovery key you saved when this account was created.
        </Text>
      </div>

      {formError && (
        <Alert color="red" variant="light">
          {formError}
        </Alert>
      )}

      <TextInput
        label="Recovery key"
        placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
        value={values.recoveryKey}
        error={errors.recoveryKey}
        onChange={(e) => set('recoveryKey', e.currentTarget.value)}
        autoFocus
      />

      <PasswordInput
        label="New password"
        description="At least 8 characters, including a letter and a number"
        value={values.newPassword}
        error={errors.newPassword}
        onChange={(e) => set('newPassword', e.currentTarget.value)}
      />

      <PasswordInput
        label="Confirm new password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(e) => set('confirmPassword', e.currentTarget.value)}
      />

      <Alert color="gray" variant="light">
        <Text size="sm">
          Your patient data is not affected. Resetting the password re-locks the existing
          data under the new password.
        </Text>
      </Alert>

      <Group justify="space-between" mt="xs">
        <Button variant="subtle" onClick={() => navigate('/welcome')}>
          Back
        </Button>
        <Button onClick={handleSubmit} loading={busy}>
          Reset password
        </Button>
      </Group>
    </Stack>
  )
}
