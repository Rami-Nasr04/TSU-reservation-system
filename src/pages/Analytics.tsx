import * as React from "react"
import { Navigate } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { KpiCard } from "@/components/analytics/KpiCard"
import { RangePicker } from "@/components/analytics/RangePicker"
import { RushHourChart } from "@/components/analytics/RushHourChart"
import { WeeklyChart } from "@/components/analytics/WeeklyChart"
import { TablePerfTable } from "@/components/analytics/TablePerfTable"
import { RecentWalkInsList } from "@/components/analytics/RecentWalkInsList"
import { formatCurrency, formatNumber } from "@/components/analytics/format"
import { useAnalyticsKpi } from "@/hooks/useAnalyticsKpi"
import { useAnalyticsCharts } from "@/hooks/useAnalyticsCharts"
import { useAuth } from "@/contexts/AuthContext"
import type { AnalyticsRange, KpiSnapshot } from "@/services/analyticsService"

type PresetRange = Extract<AnalyticsRange, string>

export default function Analytics() {
  const { hasRole } = useAuth()
  const [range, setRange] = React.useState<PresetRange>("week")

  const kpi = useAnalyticsKpi(range)
  const charts = useAnalyticsCharts(range)

  // Manager-only, same guard as Settings. Cognito role wiring lands in P10b.
  if (!hasRole("manager")) {
    return <Navigate to="/" replace />
  }

  const headerCenter = (
    <span className="text-[15px] font-light tracking-[0.04em] text-foreground sm:text-[18px]">
      Analytics
    </span>
  )
  const headerActions = (
    <>
      <RangePicker value={range} onChange={setRange} />
      <ThemeToggle />
    </>
  )

  return (
    <AppShell headerCenter={headerCenter} headerActions={headerActions} bare>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-3.5 py-4 sm:gap-5 sm:px-7 sm:py-7">
        {/* KPI strip */}
        <KpiStrip
          data={kpi.data}
          isLoading={kpi.isLoading}
          error={kpi.error}
          onRetry={kpi.refetch}
        />

        {/* Charts + table + walk-ins */}
        {charts.error && !charts.data ? (
          <ErrorTile message={charts.error} onRetry={charts.refetch} />
        ) : charts.isLoading && !charts.data ? (
          <ChartsSkeleton />
        ) : charts.data ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
              <RushHourChart data={charts.data.rushHour} />
              <WeeklyChart data={charts.data.weekly} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr]">
              <TablePerfTable data={charts.data.tablePerf} />
              <RecentWalkInsList data={charts.data.walkIns} />
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

interface KpiStripProps {
  data: KpiSnapshot | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

function KpiStrip({ data, isLoading, error, onRetry }: KpiStripProps) {
  if (error && !data) {
    return <ErrorTile message={error} onRetry={onRetry} />
  }
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[112px] animate-pulse rounded-[3px] border border-hair bg-card"
          />
        ))}
      </div>
    )
  }
  if (!data) return null

  const items = [
    { key: "reservations", label: "Reservations", value: formatNumber(data.reservations.value), delta: data.reservations.deltaPct },
    { key: "revenue", label: "Revenue", value: formatCurrency(data.revenue.value), delta: data.revenue.deltaPct },
    { key: "tips", label: "Tips", value: formatCurrency(data.tips.value), delta: data.tips.deltaPct },
    { key: "avgPax", label: "Avg party", value: `${data.avgPax.value.toFixed(1)} guests`, delta: data.avgPax.deltaPct },
  ]

  return (
    <div className="-mx-3.5 flex gap-3 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
      {items.map((it) => (
        <div key={it.key} className="min-w-[72%] shrink-0 sm:min-w-0">
          <KpiCard label={it.label} value={it.value} deltaPct={it.delta} />
        </div>
      ))}
    </div>
  )
}

interface ErrorTileProps {
  message: string
  onRetry: () => void
}

function ErrorTile({ message, onRetry }: ErrorTileProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[3px] border border-hair bg-card py-12 text-center">
      <span className="text-[11.5px] text-brand-ink-soft">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-hair-strong px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft hover:text-foreground"
      >
        Try again
      </button>
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="h-[312px] animate-pulse rounded-[3px] border border-hair bg-card" />
        <div className="h-[332px] animate-pulse rounded-[3px] border border-hair bg-card" />
      </div>
      <div className="h-[280px] animate-pulse rounded-[3px] border border-hair bg-card" />
    </>
  )
}
