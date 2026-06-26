import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { WeeklyBucket } from "@/services/analyticsService"
import { AnalyticsCard } from "./AnalyticsCard"
import { ChartFrame } from "./ChartFrame"
import { formatCurrency } from "./format"
import {
  AXIS_TICK,
  AXIS_TICK_MUTE,
  GRID_STROKE,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
} from "./chartTheme"

interface WeeklyChartProps {
  data: WeeklyBucket[]
}

/** Reservations (bars) + revenue (line) by day of week on a dual Y-axis. */
export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <AnalyticsCard
      title="Weekly Overview"
      subtitle="Reservations and revenue by day of week"
      action={
        <div className="hidden items-center gap-3 text-[10.5px] tracking-[0.06em] text-brand-ink-soft sm:flex">
          <Legend />
        </div>
      }
    >
      <ChartFrame className="h-[230px] sm:h-[280px]">
        {({ width, height }) => (
          <ComposedChart width={width} height={height} data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK_MUTE}
              width={32}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK_MUTE}
              width={44}
              tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(value, name) =>
                name === "revenue"
                  ? [formatCurrency(Number(value)), "Revenue"]
                  : [`${value}`, "Reservations"]
              }
            />
            <Bar
              yAxisId="left"
              dataKey="reservations"
              fill="var(--brand-red)"
              fillOpacity={0.3}
              radius={[2, 2, 0, 0]}
              barSize={22}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="var(--foreground)"
              strokeWidth={1.6}
              dot={{ r: 3, fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 1.5 }}
              activeDot={{ r: 4.5 }}
            />
          </ComposedChart>
        )}
      </ChartFrame>
    </AnalyticsCard>
  )
}

function Legend() {
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-[1px] bg-primary/60" />
        Reservations
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-3.5 bg-foreground" />
        Revenue
      </span>
    </>
  )
}
