import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  EMPTY_PATIENT,
  calculateAge,
  patientDisplayName,
  todayIso,
  type PatientInput,
  type PatientRecord
} from '@shared/patient'
import {
  AFFECTED_SIDES,
  GENDERS,
  MUSCLE_TONE,
  PATIENT_STATUSES,
  SENSORY_STATUS
} from '@shared/clinical'

/**
 * Add and edit patient. Design document section 6.7.
 *
 * The same form serves both: the details view arrives pre-filled and adds a
 * delete action. Every field is optional.
 */

interface Props {
  opened: boolean
  patient: PatientRecord | null
  onClose: () => void
  onSaved: () => void
}

const scaleOptions = (options: { value: number; label: string }[]): { value: string; label: string }[] =>
  options.map((o) => ({ value: String(o.value), label: `${o.value} – ${o.label}` }))



export default function PatientFormModal({
  opened,
  patient,
  onClose,
  onSaved
}: Props): React.JSX.Element {
  const [values, setValues] = useState<PatientInput>(EMPTY_PATIENT)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const isEdit = patient !== null

  useEffect(() => {
    if (!opened) return
    setValues(
      patient
        ? {
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            phoneNumber: patient.phoneNumber,
            email: patient.email,
            address: patient.address,
            clinicalDiagnosis: patient.clinicalDiagnosis,
            affectedSide: patient.affectedSide,
            sensoryStatus: patient.sensoryStatus,
            muscleTone: patient.muscleTone,
            startDate: patient.startDate,
            emergencyContact: patient.emergencyContact,
            notes: patient.notes,
            status: patient.status
          }
        : // A new patient starts today, per design document 6.7.
          { ...EMPTY_PATIENT, startDate: todayIso() }
    )
    setDirty(false)
    setError(null)
  }, [opened, patient])

  const set = <K extends keyof PatientInput>(field: K, value: PatientInput[K]): void => {
    setValues((v) => ({ ...v, [field]: value }))
    setDirty(true)
  }

  const handleClose = (): void => {
    // Nothing is stored before Save. Warn rather than lose typed work.
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const handleSave = async (): Promise<void> => {
    setError(null)
    setBusy(true)
    try {
      if (isEdit) {
        await window.api.patients.update(patient.id, values)
      } else {
        await window.api.patients.create(values)
      }
      notifications.show({
        color: 'green',
        message: isEdit ? 'Patient updated' : 'Patient added'
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the patient')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setBusy(true)
    try {
      await window.api.patients.remove(patient!.id)
      notifications.show({ color: 'green', message: 'Patient deleted' })
      setConfirmDelete(false)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the patient')
    } finally {
      setBusy(false)
    }
  }

  const age = calculateAge(values.dateOfBirth)

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={isEdit ? patientDisplayName(values) : 'Add new patient'}
        size="lg"
      >
        <Stack gap="md">
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="First name"
              value={values.firstName ?? ''}
              onChange={(e) => set('firstName', e.currentTarget.value || null)}
            />
            <TextInput
              label="Last name"
              value={values.lastName ?? ''}
              onChange={(e) => set('lastName', e.currentTarget.value || null)}
            />
          </SimpleGrid>

          <SimpleGrid cols={3} spacing="sm">
            <DateInput
              label="Date of birth"
              valueFormat="DD MMM YYYY"
              clearable
              value={values.dateOfBirth}
              onChange={(value) => set('dateOfBirth', value)}
            />
            <TextInput
              label="Age"
              description="Calculated"
              value={age === null ? '' : String(age)}
              readOnly
              disabled
            />
            <Select
              label="Gender"
              clearable
              data={[...GENDERS]}
              value={values.gender}
              onChange={(v) => set('gender', v as PatientInput['gender'])}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Phone number"
              value={values.phoneNumber ?? ''}
              onChange={(e) => set('phoneNumber', e.currentTarget.value || null)}
            />
            <TextInput
              label="Email"
              value={values.email ?? ''}
              onChange={(e) => set('email', e.currentTarget.value || null)}
            />
          </SimpleGrid>

          <TextInput
            label="Address"
            value={values.address ?? ''}
            onChange={(e) => set('address', e.currentTarget.value || null)}
          />

          <TextInput
            label="Clinical diagnosis"
            value={values.clinicalDiagnosis ?? ''}
            onChange={(e) => set('clinicalDiagnosis', e.currentTarget.value || null)}
          />

          <SimpleGrid cols={3} spacing="sm">
            <Select
              label="Affected side"
              clearable
              data={[...AFFECTED_SIDES]}
              value={values.affectedSide}
              onChange={(v) => set('affectedSide', v as PatientInput['affectedSide'])}
            />
            <Select
              label="Sensory status"
              clearable
              data={scaleOptions(SENSORY_STATUS)}
              value={values.sensoryStatus === null ? null : String(values.sensoryStatus)}
              onChange={(v) => set('sensoryStatus', v === null ? null : Number(v))}
            />
            <Select
              label="Muscle tone"
              clearable
              data={scaleOptions(MUSCLE_TONE)}
              value={values.muscleTone === null ? null : String(values.muscleTone)}
              onChange={(v) => set('muscleTone', v === null ? null : Number(v))}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <DateInput
              label="Start date"
              valueFormat="DD MMM YYYY"
              clearable
              value={values.startDate}
              onChange={(value) => set('startDate', value)}
            />
            <TextInput
              label="Emergency contact"
              value={values.emergencyContact ?? ''}
              onChange={(e) => set('emergencyContact', e.currentTarget.value || null)}
            />
          </SimpleGrid>

          <Textarea
            label="Notes"
            autosize
            minRows={3}
            value={values.notes ?? ''}
            onChange={(e) => set('notes', e.currentTarget.value || null)}
          />

          <Select
            label="Status"
            data={[...PATIENT_STATUSES]}
            value={values.status}
            allowDeselect={false}
            onChange={(v) => set('status', (v ?? 'Active') as PatientInput['status'])}
          />

          <Group justify="space-between" mt="sm">
            {isEdit ? (
              <Button color="red" variant="light" onClick={() => setConfirmDelete(true)}>
                Delete patient
              </Button>
            ) : (
              <span />
            )}

            <Group>
              <Button variant="subtle" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleSave} loading={busy}>
                Save
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this patient?"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm">
            {patientDisplayName(values)} will be permanently deleted. All associated sessions
            and treatment records will be deleted with them.
          </Text>
          <Text size="sm" fw={600}>
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={busy}>
              Delete permanently
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard changes?"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">You have unsaved changes. Closing will discard them.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button
              color="red"
              onClick={() => {
                setConfirmDiscard(false)
                onClose()
              }}
            >
              Discard
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
