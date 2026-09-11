import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { CLINICAL_METRICS } from '@shared/clinical'
import { formatDate, patientDisplayName, type PatientRecord } from '@shared/patient'
import { programLabel, type Program } from '@shared/program'
import type { TrendPoint } from '@shared/report'
import TrendChart from '../components/TrendChart'

/**
 * Design document section 6.11.
 *
 * Trends in clinical feedback over time for one patient and one program.
 * Nothing is generated until both are chosen, and the report never compares
 * one program against another.
 */
export default function ReportsPage(): React.JSX.Element {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [programs, setPrograms] = useState<Program[]>([])

  const [patientId, setPatientId] = useState<number | null>(null)
  const [programId, setProgramId] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)

  const [points, setPoints] = useState<TrendPoint[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([window.api.patients.list(), window.api.programs.list()])
      .then(([p, pr]) => {
        setPatients(p)
        setPrograms(pr)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load reference data')
      )
  }, [])

  const load = useCallback(async (): Promise<void> => {
    // Both filters are required. Design document 6.11.
    if (patientId === null || programId === null) {
      setPoints(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setPoints(
        await window.api.reports.trends({ patientId, programId, dateFrom, dateTo })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build the report')
    } finally {
      setLoading(false)
    }
  }, [patientId, programId, dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  const patient = patients.find((p) => p.id === patientId) ?? null
  const program = programs.find((p) => p.id === programId) ?? null

  const patientOptions = useMemo(
    // Inactive patients are included: their history is still worth reading.
    () => patients.map((p) => ({ value: String(p.id), label: patientDisplayName(p) })),
    [patients]
  )

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: String(p.id), label: programLabel(p) })),
    [programs]
  )

  const handleExport = async (): Promise<void> => {
    if (!reportRef.current || !patient || !program) return

    setExporting(true)
    try {
      const range =
        dateFrom || dateTo
          ? `${dateFrom ? formatDate(dateFrom) : 'Earliest'} to ${dateTo ? formatDate(dateTo) : 'Latest'}`
          : 'All available sessions'

      const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Report</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #0e3b54; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  .charts > div { page-break-inside: avoid; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 24px; }
  th, td { border: 1px solid #ddd; padding: 5px 7px; text-align: left; }
  th { background: #f4f6f8; }
</style></head><body>
<h1>${patientDisplayName(patient)}</h1>
<div class="meta">
  Program: ${program.name} — ${program.shortDescription}<br>
  Date range: ${range}<br>
  Sessions included: ${points?.length ?? 0}
</div>
<div class="charts">${reportRef.current.innerHTML}</div>
${buildTable(points ?? [])}
</body></html>`

      const suggested = `${patientDisplayName(patient).replace(/\s+/g, '-')}-${program.name.replace(/\s+/g, '-')}.pdf`
      const result = await window.api.reports.exportPdf(html, suggested)

      if (result.ok) {
        notifications.show({ color: 'green', message: 'Report exported' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export the report')
    } finally {
      setExporting(false)
    }
  }

  const nothingSelected = patientId === null || programId === null
  const noSessions = points !== null && points.length === 0

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Reports</Title>
        <Button
          onClick={handleExport}
          loading={exporting}
          disabled={nothingSelected || noSessions || loading}
          variant="light"
        >
          Export to PDF
        </Button>
      </Group>

      <Paper withBorder p="sm">
        <SimpleGrid cols={4} spacing="sm">
          <Select
            label="Patient"
            placeholder="Select a patient"
            searchable
            data={patientOptions}
            value={patientId === null ? null : String(patientId)}
            onChange={(v) => setPatientId(v === null ? null : Number(v))}
          />
          <Select
            label="Program"
            placeholder="Select a program"
            data={programOptions}
            value={programId === null ? null : String(programId)}
            onChange={(v) => setProgramId(v === null ? null : Number(v))}
          />
          <DateInput
            label="From"
            placeholder="Earliest"
            valueFormat="DD MMM YYYY"
            clearable
            value={dateFrom}
            onChange={setDateFrom}
          />
          <DateInput
            label="To"
            placeholder="Latest"
            valueFormat="DD MMM YYYY"
            clearable
            value={dateTo}
            onChange={setDateTo}
          />
        </SimpleGrid>
      </Paper>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {nothingSelected && (
        <Text c="dimmed" py="xl" ta="center">
          Select a patient and program to view reports.
        </Text>
      )}

      {!nothingSelected && loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!nothingSelected && !loading && noSessions && (
        <Text c="dimmed" py="xl" ta="center">
          No session data is available for the selected patient and program.
        </Text>
      )}

      {!nothingSelected && !loading && points !== null && points.length > 0 && (
        <div ref={reportRef}>
          <Stack gap="md">
            {CLINICAL_METRICS.map((metric) => (
              <TrendChart
                key={metric.key}
                title={metric.title}
                max={metric.max}
                options={[...metric.options]}
                data={points.map((p) => ({
                  sessionId: p.sessionId,
                  sessionDate: p.sessionDate,
                  value: p[metric.key]
                }))}
              />
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  )
}

/** The underlying trend data, included in the PDF as design doc 18.6 requires. */
function buildTable(points: TrendPoint[]): string {
  if (points.length === 0) return ''

  const rows = points
    .map(
      (p) => `<tr>
      <td>${p.sessionId}</td>
      <td>${formatDate(p.sessionDate)}</td>
      <td>${p.painScore ?? '—'}</td>
      <td>${p.generalFeeling ?? '—'}</td>
      <td>${p.perceivedImprovement ?? '—'}</td>
      <td>${p.muscleResponse ?? '—'}</td>
      <td>${p.patientTolerance ?? '—'}</td>
    </tr>`
    )
    .join('')

  return `<table>
    <thead><tr>
      <th>Session</th><th>Date</th><th>Pain</th><th>Feeling</th>
      <th>Improvement</th><th>Response</th><th>Tolerance</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}
