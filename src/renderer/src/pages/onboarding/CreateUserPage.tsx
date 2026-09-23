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
  country: '',
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
      const result = await window.api.auth.createUser(values)

      if (!result.ok) {
        setFormError(result.message ?? 'Could not create the account')
        return
      }

      // Carried in navigation state, never persisted. It is shown once.
      navigate('/onboarding/recovery-key', {
        replace: true,
        state: { recoveryKey: result.recoveryKey }
      })
    } catch {
      setFormError('Something went wrong. Please try again.')
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
          description="Re-enter your password to confirm"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => set('confirmPassword', e.currentTarget.value)}
        />
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="Country"
          value={values.country}
          error={errors.country}
          onChange={(e) => set('country', e.currentTarget.value)}
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
        title="STIMEL-03 STANDALONE SOFTWARE DISCLAIMER"
        size="lg"
      >
        <Text size="sm">
          The Stimel-03 Standalone Software is provided as a data-entry, record-management, and reporting tool for use by the clinic or healthcare organization operating the software.
          Ownership and Responsibility for Data
          All patient, clinical, treatment, administrative, and other information entered into or stored within the software remains under the ownership and control of the clinic or healthcare organization using the software, subject to applicable law. Motion Informatics Ltd. does not claim ownership of such information.
          The clinic is solely responsible for the accuracy, completeness, legality, confidentiality, security, retention, backup, and appropriate use of all information entered into or stored within the software.
          Standalone Operation
          The software operates as a standalone application. Information is entered manually and is stored and managed by the clinic. Unless separately agreed in writing, Motion Informatics Ltd. does not maintain, monitor, control, or independently back up the clinic's database.
          No Warranty
          The software is provided on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, Motion Informatics Ltd. makes no warranties, express or implied, regarding the uninterrupted operation, availability, accuracy, reliability, performance, data retention, or fitness of the software for any particular purpose.
          Loss or Corruption of Data
          The clinic is responsible for maintaining appropriate and regular backups of its database and information.
          To the maximum extent permitted by applicable law, Motion Informatics Ltd. shall not be responsible or liable for any loss, deletion, corruption, alteration, unauthorized access, inability to retrieve, or other compromise of data, whether resulting from hardware failure, software failure, user error, failure to perform backups, computer malfunction, operating-system failure, malware, cybersecurity incident, power failure, third-party software, or any other cause.
          Limitation of Liability
          To the maximum extent permitted by applicable law, Motion Informatics Ltd. shall not be liable for any direct or indirect loss, damage, business interruption, loss of records, loss of revenue, loss of opportunity, or consequential or incidental damages arising from the use of, inability to use, or reliance upon the software or information stored within it.
          Clinical Responsibility
          The software is a record-management and reporting tool and does not replace professional clinical judgment. The clinic and its authorized healthcare professionals remain solely responsible for all clinical decisions, treatment decisions, patient care, and interpretation of information recorded or generated through the software.
          By using the Stimel-03 Standalone Software, the clinic acknowledges and accepts these conditions.
        </Text>
      </Modal>
    </Stack>
  )
}
