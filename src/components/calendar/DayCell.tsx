import { cn } from "@/lib/utils"
import { Overline } from "@/components/brand"
import { ReservationChip } from "./ReservationChip"
import { CountDots } from "./CountDots"
import type { MonthDay } from "@/services/reservationsService"

export type DayCellVariant = "mobile" | "tablet" | "desktop"

interface DayCellProps {
  day: MonthDay | null // null = blank lead-in/trailing cell
  variant: DayCellVariant
  isPast: boolean
  isToday: boolean
  isWeekend: boolean
  max: number
  onClick?: () => void
}

const MIN_H: Record<DayCellVariant, string> = {
  mobile: "min-h-16",
  tablet: "min-h-[6rem]",
  desktop: "min-h-[6.75rem]",
}

const PAD: Record<DayCellVariant, string> = {
  mobile: "p-1.5 pb-2",
  tablet: "px-2.5 py-1.5",
  desktop: "px-3 py-1.5",
}

export function DayCell({
  day,
  variant,
  isPast,
  isToday,
  isWeekend,
  max,
  onClick,
}: DayCellProps) {
  const empty = day === null
  const isClosed = !empty && day.count === 0
  const showChips = variant !== "mobile" && !empty && !isClosed

  const maxChips = variant === "tablet" ? 2 : 3
  const visibleChips = !empty && !isClosed ? day.items.slice(0, maxChips) : []
  const extra = !empty && !isClosed ? Math.max(0, day.count - maxChips) : 0

  // Heatmap intensity: 0..15% brand-red alpha, scaled by count/max.
  const intensity =
    empty || isClosed || max === 0
      ? 0
      : Math.min(0.15, (day.count / max) * 0.15)

  return (
    <div
      onClick={empty ? undefined : onClick}
      className={cn(
        "relative box-border overflow-hidden border-r border-b border-hair bg-card",
        MIN_H[variant],
        PAD[variant],
        empty ? "cursor-default bg-foreground/[0.015] opacity-40" : "cursor-pointer",
      )}
    >
      {/* heatmap tint */}
      {!empty && intensity > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-primary"
          style={{ opacity: intensity }}
        />
      )}
      {/* today ring */}
      {isToday && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border-[1.5px] border-primary"
        />
      )}

      {/* header row: day number + count */}
      <div className="relative flex items-start justify-between">
        {!empty && (
          <div
            className={cn(
              "leading-none tracking-[0.02em]",
              variant === "mobile" ? "text-[13px]" : variant === "tablet" ? "text-[14px]" : "text-[15px]",
              isToday
                ? "font-medium text-primary"
                : isPast
                  ? "font-light text-brand-ink-mute"
                  : isWeekend
                    ? "font-normal text-foreground"
                    : "font-light text-foreground",
            )}
          >
            {day.day}
          </div>
        )}
        {!empty && !isClosed &&
          (variant === "mobile" ? (
            <CountDots count={day.count} max={max} />
          ) : (
            <span
              className={cn(
                "rounded-full border border-hair px-2 py-[2px] text-[10px] font-medium leading-none tracking-[0.08em]",
                "bg-card/85",
                isPast ? "text-brand-ink-mute" : "text-foreground",
              )}
            >
              {day.count}
            </span>
          ))}
      </div>

      {/* closed label */}
      {isClosed && (
        <div className="absolute inset-0 flex items-center justify-center px-1">
          <Overline
            size="xs"
            tone="mute"
            className={cn(
              variant === "mobile" ? "tracking-[0.12em]" : "tracking-[0.3em]",
            )}
          >
            Closed
          </Overline>
        </div>
      )}

      {/* reservation chips */}
      {showChips && (
        <div
          className={cn(
            "relative flex flex-col gap-[2px]",
            variant === "tablet" ? "mt-1" : "mt-1.5",
          )}
        >
          {visibleChips.map((it, i) => (
            <ReservationChip
              key={i}
              item={it}
              muted={isPast}
              compact={variant === "tablet"}
            />
          ))}
          {extra > 0 && (
            <div
              className={cn(
                "pl-0.5 tracking-[0.04em]",
                variant === "tablet" ? "text-[10px]" : "text-[10.5px]",
                isPast ? "text-brand-ink-mute" : "text-brand-ink-soft",
              )}
            >
              +{extra} more
            </div>
          )}
        </div>
      )}
    </div>
  )
}
