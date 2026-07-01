import type { RecentWalkIn } from "@/services/analyticsService"
import { cn } from "@/lib/utils"
import { formatTime12, parseDateISO } from "@/lib/dates"
import { AnalyticsCard } from "./AnalyticsCard"

interface RecentWalkInsListProps {
  data: RecentWalkIn[]
}

/** Most-recent walk-ins across all sections (newest first). */
export function RecentWalkInsList({ data }: RecentWalkInsListProps) {
  return (
    <AnalyticsCard title="Recent Walk-ins" subtitle="Newest first, all sections" noPad>
      {data.length === 0 ? (
        <div className="py-10 text-center text-[11.5px] tracking-[0.02em] text-brand-ink-mute">
          No walk-ins in this range.
        </div>
      ) : (
        <ul>
          {data.map((w, i) => (
            <li
              key={w.id}
              className={cn(
                "flex items-center gap-3.5 px-5 py-3",
                i > 0 && "border-t border-hair",
              )}
            >
              <span className="w-12 shrink-0 text-[13px] tracking-[0.04em] text-primary tabular-nums">
                {formatTime12(w.time)}
              </span>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-[13px] tracking-[0.02em] text-foreground">
                  {w.tables.length > 0 ? w.tables.join(" + ") : "—"}
                </span>
                {w.customerName && (
                  <span className="truncate text-[11px] tracking-[0.02em] text-brand-ink-soft">
                    · {w.customerName}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[11px] tracking-[0.06em] text-brand-ink-soft">
                PAX <span className="text-foreground tabular-nums">{w.pax}</span>
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] tracking-[0.04em] text-brand-ink-mute tabular-nums">
                {formatDayLabel(w.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  )
}

/** "May 12" style label from a YYYY-MM-DD string (no TZ parse). */
function formatDayLabel(iso: string): string {
  const p = parseDateISO(iso)
  if (!p) return iso
  return new Date(p.year, p.month0, p.day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
