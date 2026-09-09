import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { validateRegistration, type RegistrationInput } from '@shared/auth'

/**
 * Design document section 6.2. Every field here is required — the only
 * screen in the application where that is true.
 *
 * Validation here is for field feedback only. The main process re-checks
 * everything with Zod before anything is written.
 */

const EMPTY: RegistrationInput = {
  firstName: '',
  lastName: '',
  medicalLicenseNumber: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  state: '',
  city: '',
  fullAddress: '',
  disclaimerAccepted: false
}

export default function CreateUserPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [values, setValues] = useState<RegistrationInput>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof RegistrationInput, value: string | boolean): void => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handleSubmit = async (): Promise<void> => {
    setFormError(null)

    const fieldErrors = validateRegistration(values)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setBusy(true)
    try {
      const { recoveryKey } = await window.api.auth.createUser(values)
      // Carried in navigation state, never persisted. It is shown once.
      navigate('/onboarding/recovery-key', { replace: true, state: { recoveryKey } })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Create your account</Title>
        <Text c="dimmed" size="sm">
          This account is stored only on this computer.
        </Text>
      </div>

      {formError && (
        <Alert color="red" variant="light">
          {formError}
        </Alert>
      )}

      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="First name"
          value={values.firstName}
          error={errors.firstName}
          onChange={(e) => set('firstName', e.currentTarget.value)}
        />
        <TextInput
          label="Last name"
          value={values.lastName}
          error={errors.lastName}
          onChange={(e) => set('lastName', e.currentTarget.value)}
        />
      </SimpleGrid>

      <TextInput
        label="Medical license number"
        value={values.medicalLicenseNumber}
        error={errors.medicalLicenseNumber}
        onChange={(e) => set('medicalLicenseNumber', e.currentTarget.value)}
      />

      <TextInput
        label="Email"
        value={values.email}
        error={errors.email}
        onChange={(e) => set('email', e.currentTarget.value)}
      />

      <TextInput
        label="Username"
        description="Used to sign in on this computer"
        value={values.username}
        error={errors.username}
        onChange={(e) => set('username', e.currentTarget.value)}
      />

      <SimpleGrid cols={2} spacing="sm">
        <PasswordInput
          label="Password"
          description="At least 8 characters, including a letter and a number"
          value={values.password}
          error={errors.password}
          onChange={(e) => set('password', e.currentTarget.value)}
        />
        <PasswordInput
          label="Confirm password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => set('confirmPassword', e.currentTarget.value)}
        />
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="State"
          value={values.state}
          error={errors.state}
          onChange={(e) => set('state', e.currentTarget.value)}
        />
        <TextInput
          label="City"
          value={values.city}
          error={errors.city}
          onChange={(e) => set('city', e.currentTarget.value)}
        />
      </SimpleGrid>

      <TextInput
        label="Full address"
        value={values.fullAddress}
        error={errors.fullAddress}
        onChange={(e) => set('fullAddress', e.currentTarget.value)}
      />

      <Checkbox
        checked={values.disclaimerAccepted}
        error={errors.disclaimerAccepted}
        onChange={(e) => set('disclaimerAccepted', e.currentTarget.checked)}
        label={
          <Text size="sm">
            I have read and accept the{' '}
            <Anchor
              component="button"
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setDisclaimerOpen(true)
              }}
            >
              disclaimer
            </Anchor>
          </Text>
        }
      />

      <Group justify="space-between" mt="xs">
        <Button variant="subtle" onClick={() => navigate('/onboarding/restore')}>
          Restore from backup
        </Button>
        <Button onClick={handleSubmit} loading={busy}>
          Create account
        </Button>
      </Group>

      <Modal
        opened={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        title="Disclaimer"
        size="lg"
      >
        <Text size="sm">
          Placeholder. The disclaimer text is supplied by the product owner — see design
          document open question 9.3, which also asks whether its wording must be
          version-tracked.
        </Text>
      </Modal>
    </Stack>
  )
}
