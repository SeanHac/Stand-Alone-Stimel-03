import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Paper, Text, Stack } from '@mantine/core'
import { describeScore, type ScaleOption } from '@shared/clinical'
import { formatDate } from '@shared/patient'

/**
 * One clinical feedback metric plotted over time.
 * See Application Design Document section 6.11.
 */

interface Row {
  sessionId: number
  sessionDate: string | null
  value: number | null
}

interface Props {
  title: string
  max: number
  options: ScaleOption[]
  data: Row[]
}

interface TooltipPayload {
  payload: Row
}

function ChartTooltip({
  active,
  payload,
  options
}: {
  active?: boolean
  payload?: TooltipPayload[]
  options: ScaleOption[]
}): React.JSX.Element | null {
  if (!active || !payload?.length) return null

  const row = payload[0].payload
  if (row.value === null) return null

  return (
    <Paper withBorder shadow="sm" p="xs" radius="sm">
      <Text size="xs" c="dimmed">
        {formatDate(row.sessionDate)} · Session {row.sessionId}
      </Text>
      <Text size="sm" fw={600}>
        {describeScore(options, row.value)}
      </Text>
    </Paper>
  )
}

export default function TrendChart({
  title,
  max,
  options,
  data
}: Props): React.JSX.Element {
  // A session with no value for this metric is skipped, never plotted as
  // zero: zero sits below the bottom of every scale and would invent a data
  // point worse than any real one. Design document 6.11.
  const hasAnyValue = data.some((row) => row.value !== null)

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Text fw={600} size="sm">
          {title}
        </Text>

        {!hasAnyValue ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            No data is available for this Clinical Feedback metric.
          </Text>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-3)" />
              <XAxis
                dataKey="sessionDate"
                tickFormatter={(value: string | null) => formatDate(value)}
                tick={{ fontSize: 11 }}
                stroke="var(--mantine-color-gray-6)"
              />
              <YAxis
                domain={[1, max]}
                ticks={Array.from({ length: max }, (_, i) => i + 1)}
                tick={{ fontSize: 11 }}
                stroke="var(--mantine-color-gray-6)"
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip options={options} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--mantine-color-brand-6)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                // Joins the line across a session that has no value for
                // this metric, rather than breaking the trend into pieces.
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Stack>
    </Paper>
  )
}
