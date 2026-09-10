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
  EMPTY_SESSION,
  durationProblem,
  type SessionFormValues,
  type SessionRecord
} from '@shared/session'
import { programLabel, type Program } from '@shared/program'
import { patientDisplayName, todayIso, type PatientRecord } from '@shared/patient'
import {
  AFFECTED_SIDES,
  BIOFEEDBACK,
  GENERAL_FEELING,
  MUSCLE_RESPONSE,
  PAIN_SCORE,
  PATIENT_TOLERANCE,
  PERCEIVED_IMPROVEMENT
} from '@shared/clinical'

/**
 * Add and edit session. Design document section 6.9.
 *
 * Every field except patient and program is optional. The five clinical
 * feedback dropdowns show the number with its description; only the number
 * is stored.
 */

interface Props {
  opened: boolean
  session: SessionRecord | null
  patients: PatientRecord[]
  programs: Program[]
  onClose: () => void
  onSaved: () => void
}

const scaleData = (
  options: { value: number; label: string }[]
): { value: string; label: string }[] =>
  options.map((o) => ({ value: String(o.value), label: `${o.value} – ${o.label}` }))

export default function SessionFormModal({
  opened,
  session,
  patients,
  programs,
  onClose,
  onSaved
}: Props): React.JSX.Element {
  const [values, setValues] = useState<SessionFormValues>(EMPTY_SESSION)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const isEdit = session !== null

  useEffect(() => {
    if (!opened) return
    setValues(
      session
        ? {
            patientId: session.patientId,
            sessionDate: session.sessionDate,
            programId: session.programId,
            treatmentDurationMin: session.treatmentDurationMin,
            biofeedback: session.biofeedback,
            affectedSide: session.affectedSide,
            painScore: session.painScore,
            generalFeeling: session.generalFeeling,
            perceivedImprovement: session.perceivedImprovement,
            muscleResponse: session.muscleResponse,
            patientTolerance: session.patientTolerance,
            notes: session.notes
          }
        : { ...EMPTY_SESSION, sessionDate: todayIso() }
    )
    setDirty(false)
    setError(null)
  }, [opened, session])

  const set = <K extends keyof SessionFormValues>(
    field: K,
    value: SessionFormValues[K]
  ): void => {
    setValues((v) => ({ ...v, [field]: value }))
    setDirty(true)
  }

  const handleClose = (): void => {
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const handleSave = async (): Promise<void> => {
    setError(null)

    if (values.patientId === null) return setError('Select a patient')
    if (values.programId === null) return setError('Select a program')

    const durationError = durationProblem(values.treatmentDurationMin)
    if (durationError) return setError(durationError)

    setBusy(true)
    try {
      const payload = { ...values, patientId: values.patientId, programId: values.programId }

      if (isEdit) {
        await window.api.sessions.update(session.id, payload)
      } else {
        await window.api.sessions.create(payload)
      }

      notifications.show({
        color: 'green',
        message: isEdit ? 'Session updated' : 'Session added'
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setBusy(true)
    try {
      await window.api.sessions.remove(session!.id)
      notifications.show({ color: 'green', message: 'Session deleted' })
      setConfirmDelete(false)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the session')
    } finally {
      setBusy(false)
    }
  }

  // Only Active patients may be chosen for a new session (design doc 6.9).
  // When editing, the patient already attached is kept in the list even if
  // they have since been made Inactive, so the record stays editable.
  const patientOptions = patients
    .filter((p) => p.status === 'Active' || p.id === values.patientId)
    .map((p) => ({ value: String(p.id), label: patientDisplayName(p) }))

  const programOptions = programs.map((p) => ({
    value: String(p.id),
    label: programLabel(p)
  }))

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={isEdit ? `Session ${session.id}` : 'Add new session'}
        size="lg"
      >
        <Stack gap="md">
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <SimpleGrid cols={2} spacing="sm">
            <Select
              label="Patient"
              placeholder="Select a patient"
              searchable
              data={patientOptions}
              value={values.patientId === null ? null : String(values.patientId)}
              onChange={(v) => set('patientId', v === null ? null : Number(v))}
            />
            <DateInput
              label="Session date"
              valueFormat="DD MMM YYYY"
              clearable
              value={values.sessionDate}
              onChange={(value) => set('sessionDate', value)}
            />
          </SimpleGrid>

          <Select
            label="Program"
            placeholder="Select a program"
            data={programOptions}
            value={values.programId === null ? null : String(values.programId)}
            onChange={(v) => set('programId', v === null ? null : Number(v))}
          />

          <SimpleGrid cols={3} spacing="sm">
            <TextInput
              label="Treatment duration (min)"
              value={values.treatmentDurationMin ?? ''}
              onChange={(e) => set('treatmentDurationMin', e.currentTarget.value || null)}
            />
            <Select
              label="Biofeedback"
              clearable
              data={[...BIOFEEDBACK]}
              value={values.biofeedback}
              onChange={(v) => set('biofeedback', v as SessionFormValues['biofeedback'])}
            />
            <Select
              label="Affected side"
              clearable
              data={[...AFFECTED_SIDES]}
              value={values.affectedSide}
              onChange={(v) => set('affectedSide', v as SessionFormValues['affectedSide'])}
            />
          </SimpleGrid>

          <Text fw={600} size="sm" mt="xs">
            Clinical feedback
          </Text>

          <SimpleGrid cols={2} spacing="sm">
            <Select
              label="Pain score"
              clearable
              data={scaleData(PAIN_SCORE)}
              value={values.painScore === null ? null : String(values.painScore)}
              onChange={(v) => set('painScore', v === null ? null : Number(v))}
            />
            <Select
              label="General feeling"
              clearable
              data={scaleData(GENERAL_FEELING)}
              value={values.generalFeeling === null ? null : String(values.generalFeeling)}
              onChange={(v) => set('generalFeeling', v === null ? null : Number(v))}
            />
            <Select
              label="Perceived improvement"
              clearable
              data={scaleData(PERCEIVED_IMPROVEMENT)}
              value={
                values.perceivedImprovement === null
                  ? null
                  : String(values.perceivedImprovement)
              }
              onChange={(v) => set('perceivedImprovement', v === null ? null : Number(v))}
            />
            <Select
              label="Muscle response"
              clearable
              data={scaleData(MUSCLE_RESPONSE)}
              value={values.muscleResponse === null ? null : String(values.muscleResponse)}
              onChange={(v) => set('muscleResponse', v === null ? null : Number(v))}
            />
            <Select
              label="Patient tolerance"
              clearable
              data={scaleData(PATIENT_TOLERANCE)}
              value={values.patientTolerance === null ? null : String(values.patientTolerance)}
              onChange={(v) => set('patientTolerance', v === null ? null : Number(v))}
            />
          </SimpleGrid>

          <Textarea
            label="Notes"
            autosize
            minRows={3}
            value={values.notes ?? ''}
            onChange={(e) => set('notes', e.currentTarget.value || null)}
          />

          <Group justify="space-between" mt="sm">
            {isEdit ? (
              <Button color="red" variant="light" onClick={() => setConfirmDelete(true)}>
                Delete session
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
        title="Delete this session?"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Session {session?.id} will be permanently deleted, along with all information
            recorded against it.
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
