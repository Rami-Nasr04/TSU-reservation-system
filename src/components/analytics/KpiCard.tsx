import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDelta } from "./format"

interface KpiCardProps {
  label: string
  /** Pre-formatted display value (e.g. "$12,640", "3.4 guests"). */
  value: string
  deltaPct: number
}

/** One KPI tile: label, large value, and a coloured delta vs the prior period. */
export function KpiCard({ label, value, deltaPct }: KpiCardProps) {
  const up = deltaPct >= 0
  return (
    <div className="relative overflow-hidden rounded-[3px] border border-hair bg-card px-5 py-5">
      {/* Brand-red accent tick, top-left */}
      <span className="absolute left-0 top-0 h-0.5 w-8 bg-primary" />
      <div className="mb-3.5 text-[10px] font-medium uppercase tracking-[0.26em] text-brand-ink-soft">
        {label}
      </div>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="text-[32px] font-light leading-none tracking-[0.01em] text-foreground tabular-nums">
          {value}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.04em] tabular-nums",
            up ? "text-brand-positive" : "text-destructive",
          )}
        >
          {up ? (
            <TrendingUp className="size-3" strokeWidth={2} />
          ) : (
            <TrendingDown className="size-3" strokeWidth={2} />
          )}
          {formatDelta(deltaPct)}
        </span>
      </div>
      <div className="mt-2 text-[11px] tracking-[0.02em] text-brand-ink-mute">
        vs prior period
      </div>
    </div>
  )
}
