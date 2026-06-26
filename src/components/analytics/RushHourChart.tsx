import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RushHourBucket } from "@/services/analyticsService"
import { AnalyticsCard } from "./AnalyticsCard"
import { ChartFrame } from "./ChartFrame"
import {
  AXIS_TICK,
  AXIS_TICK_MUTE,
  GRID_STROKE,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_CURSOR,
  TOOLTIP_LABEL_STYLE,
} from "./chartTheme"

interface RushHourChartProps {
  data: RushHourBucket[]
}

/** Hourly reservation counts as a bar chart; the peak hour is highlighted. */
export function RushHourChart({ data }: RushHourChartProps) {
  const peak = data.reduce(
    (best, b) => (b.count > best.count ? b : best),
    data[0] ?? { hour: 0, count: 0 },
  )
  const hasData = data.some((d) => d.count > 0)
  const subtitle = hasData
    ? `Reservations per hour · peak ${peak.hour}:00 (${peak.count})`
    : "Reservations per hour"

  return (
    <AnalyticsCard title="Rush Hour" subtitle={subtitle}>
      <ChartFrame className="h-[220px] sm:h-[260px]">
        {({ width, height }) => (
          <BarChart width={width} height={height} data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(h: number) => `${h}:00`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK_MUTE}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              cursor={TOOLTIP_CURSOR}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(value) => [`${value} res.`, "Reservations"]}
              labelFormatter={(h) => `${h}:00`}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.hour}
                  fill="var(--brand-red)"
                  fillOpacity={hasData && d.hour === peak.hour ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ChartFrame>
    </AnalyticsCard>
  )
}
