import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ActionIcon, Group, Paper, Text, Stack } from '@mantine/core'
import { describeScore, type ScaleOption } from '@shared/clinical'
import { formatDate } from '@shared/patient'

/**
 * One clinical feedback metric plotted over time.
 * See Application Design Document section 6.11.
 *
 * Colours are literal hex rather than CSS variables. The export renders
 * this markup in a separate window that has none of the application's
 * stylesheets, so a var() stroke resolves to nothing and the line vanishes
 * from the PDF.
 */

const LINE_COLOUR = '#2c5f9e'
const GRID_COLOUR = '#dee2e6'
const AXIS_COLOUR = '#868e96'

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
  /** Compact charts sit two to a row; expanded ones fill the width. */
  expanded?: boolean
  onExpand?: () => void
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
  data,
  expanded = false,
  onExpand
}: Props): React.JSX.Element {
  // A session with no value for this metric is skipped, never plotted as
  // zero: zero sits below the bottom of every scale and would invent a data
  // point worse than any real one. Design document 6.11.
  const hasAnyValue = data.some((row) => row.value !== null)

  // The brush is the zoom control. It needs room, so it only appears on the
  // expanded view and only when there is enough data to be worth scrubbing.
  const showBrush = expanded && data.length > 3

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="sm">
            {title}
          </Text>
          {onExpand && (
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={onExpand}
              aria-label={`Expand ${title}`}
            >
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </ActionIcon>
          )}
        </Group>

        {!hasAnyValue ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            No data is available for this Clinical Feedback metric.
          </Text>
        ) : (
          <ResponsiveContainer width="100%" height={expanded ? 360 : 190}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: showBrush ? 4 : 4, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOUR} />
              <XAxis
                dataKey="sessionDate"
                tickFormatter={(value: string | null) => formatDate(value)}
                tick={{ fontSize: 10 }}
                stroke={AXIS_COLOUR}
              />
              <YAxis
                domain={[1, max]}
                ticks={Array.from({ length: max }, (_, i) => i + 1)}
                tick={{ fontSize: 10 }}
                stroke={AXIS_COLOUR}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip options={options} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={LINE_COLOUR}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLOUR }}
                activeDot={{ r: 5 }}
                // Joins the line across a session that has no value for
                // this metric, rather than breaking the trend into pieces.
                connectNulls
                isAnimationActive={false}
              />
              {showBrush && (
                <Brush
                  dataKey="sessionDate"
                  height={22}
                  stroke={LINE_COLOUR}
                  travellerWidth={8}
                  tickFormatter={(value: string) => formatDate(value)}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Stack>
    </Paper>
  )
}
