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
import { validateRecovery, type RecoveryInput } from '@shared/auth'

/**
 * Account recovery. See Application Design Document section 4.2.
 *
 * The recovery key unwraps the database key, which is then re-wrapped under
 * the new password. The database itself is never re-encrypted — only the
 * wrapped key is rewritten, so no patient data is touched.
 */
export default function RecoveryPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [values, setValues] = useState<RecoveryInput>({
    recoveryKey: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof RecoveryInput, value: string): void => {
    setValues((v) => ({ ...v, [field]: value }))
    setFormError(null)

    setErrors((e) => {
      const next = { ...e, [field]: '' }
      // The two password fields are validated against each other, so an
      // edit to either clears the mismatch shown under the second.
      if (field === 'newPassword' || field === 'confirmPassword') {
        next.newPassword = ''
        next.confirmPassword = ''
      }
      return next
    })
  }

  const handleSubmit = async (): Promise<void> => {
    setFormError(null)

    const fieldErrors = validateRecovery(values)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setBusy(true)
    try {
      const result = await window.api.auth.resetPassword(
        values.recoveryKey,
        values.newPassword
      )

      if (!result.ok) {
        setFormError(result.message ?? 'That recovery key is not valid')
        return
      }

      navigate('/login', {
        replace: true,
        state: {
          notice: 'Your password has been reset. Sign in with the new password.'
        }
      })
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={2} align="center">
        <Title order={3} className="auth-heading">
          Account recovery
        </Title>
        <Text className="auth-subheading">
          Enter the recovery key you saved when this account was created.
        </Text>
      </Stack>

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
