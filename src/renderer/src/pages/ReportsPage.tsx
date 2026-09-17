import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
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
import { formatDate, patientDisplayName } from '@shared/patient'
import { programLabel } from '@shared/program'
import type { TrendPoint } from '@shared/report'
import { toMessage } from '@shared/errors'
import { useData } from '../data/DataContext'
import TrendChart from '../components/TrendChart'

/**
 * Design document section 6.11.
 *
 * Trends in clinical feedback over time for one patient and one program.
 * The report is a filter over sessions already held in memory, so changing
 * a filter redraws immediately rather than querying the database.
 */

type MetricKey = (typeof CLINICAL_METRICS)[number]['key']

export default function ReportsPage(): React.JSX.Element {
  const { sessions, patients, programs } = useData()

  const [patientId, setPatientId] = useState<number | null>(null)
  const [programId, setProgramId] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [expanded, setExpanded] = useState<MetricKey | null>(null)

  const reportRef = useRef<HTMLDivElement>(null)

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

  const points = useMemo<TrendPoint[] | null>(() => {
    // Both filters are required. Design document 6.11.
    if (patientId === null || programId === null) return null

    return sessions
      .filter((s) => s.patientId === patientId && s.programId === programId)
      .filter((s) => !dateFrom || (s.sessionDate ?? '') >= dateFrom)
      .filter((s) => !dateTo || (s.sessionDate ?? '') <= dateTo)
      .sort(
        (a, b) => (a.sessionDate ?? '').localeCompare(b.sessionDate ?? '') || a.id - b.id
      )
      .map((s) => ({
        sessionId: s.id,
        sessionDate: s.sessionDate,
        painScore: s.painScore,
        generalFeeling: s.generalFeeling,
        perceivedImprovement: s.perceivedImprovement,
        muscleResponse: s.muscleResponse,
        patientTolerance: s.patientTolerance
      }))
  }, [sessions, patientId, programId, dateFrom, dateTo])

  const seriesFor = (
    key: MetricKey
  ): { sessionId: number; sessionDate: string | null; value: number | null }[] =>
    (points ?? []).map((p) => ({
      sessionId: p.sessionId,
      sessionDate: p.sessionDate,
      value: p[key]
    }))

  const handleExport = async (): Promise<void> => {
    if (!reportRef.current || !patient || !program) return

    setExporting(true)
    setError(null)
    try {
      const range =
        dateFrom || dateTo
          ? `${dateFrom ? formatDate(dateFrom) : 'Earliest'} to ${dateTo ? formatDate(dateTo) : 'Latest'}`
          : 'All available sessions'

      // The charts are inline SVG with literal colours, so they survive
      // being lifted into a document that has none of this application's
      // stylesheets.
      const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Report</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
  h1 { font-size: 19px; margin: 0 0 4px; color: #0e3b54; }
  .meta { font-size: 11px; color: #666; margin-bottom: 18px; line-height: 1.6; }
  .chart { page-break-inside: avoid; margin-bottom: 14px; border: 1px solid #e9ecef; border-radius: 8px; padding: 10px; }
  .chart svg { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; margin-top: 18px; page-break-inside: avoid; }
  th, td { border: 1px solid #dee2e6; padding: 4px 6px; text-align: left; }
  th { background: #f4f6f8; }
</style></head><body>
<h1>${patientDisplayName(patient)}</h1>
<div class="meta">
  Program: ${program.name} — ${program.shortDescription}<br>
  Date range: ${range}<br>
  Sessions included: ${points?.length ?? 0}<br>
  Generated: ${new Date().toLocaleString()}
</div>
${reportRef.current.innerHTML}
${buildTable(points ?? [])}
</body></html>`

      const suggested = `${patientDisplayName(patient).replace(/\s+/g, '-')}-${program.name.replace(/\s+/g, '-')}.pdf`
      const result = await window.api.reports.exportPdf(html, suggested)

      if (result.ok) {
        notifications.show({ color: 'green', message: 'Report exported' })
      }
    } catch (err) {
      setError(toMessage(err, 'Could not export the report'))
    } finally {
      setExporting(false)
    }
  }

  const nothingSelected = patientId === null || programId === null
  const noSessions = points !== null && points.length === 0
  const expandedMetric = CLINICAL_METRICS.find((m) => m.key === expanded) ?? null

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>Reports</Title>
          <Text className="page-subtitle">Clinical feedback trends over time</Text>
        </Stack>
        <Button
          onClick={handleExport}
          loading={exporting}
          disabled={nothingSelected || noSessions}
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
        <Paper withBorder p="xl">
          <Text c="dimmed" ta="center">
            Select a patient and program to view reports.
          </Text>
        </Paper>
      )}

      {!nothingSelected && noSessions && (
        <Paper withBorder p="xl">
          <Text c="dimmed" ta="center">
            No session data is available for the selected patient and program.
          </Text>
        </Paper>
      )}

      {!nothingSelected && points !== null && points.length > 0 && (
        <>
          <Text size="xs" c="dimmed">
            Select the expand icon on any graph to enlarge it and scrub through a date range.
          </Text>

          <div ref={reportRef}>
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
              {CLINICAL_METRICS.map((metric) => (
                <div key={metric.key} className="chart">
                  <TrendChart
                    title={metric.title}
                    max={metric.max}
                    options={[...metric.options]}
                    data={seriesFor(metric.key)}
                    onExpand={() => setExpanded(metric.key)}
                  />
                </div>
              ))}
            </SimpleGrid>
          </div>
        </>
      )}

      <Modal
        opened={expandedMetric !== null}
        onClose={() => setExpanded(null)}
        title={expandedMetric?.title}
        size="xl"
      >
        {expandedMetric && (
          <TrendChart
            title={expandedMetric.title}
            max={expandedMetric.max}
            options={[...expandedMetric.options]}
            data={seriesFor(expandedMetric.key)}
            expanded
          />
        )}
      </Modal>
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
