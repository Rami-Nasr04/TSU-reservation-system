import { cn } from "@/lib/utils"
import { Overline } from "@/components/brand"

interface KpiStripProps {
  reservations: number
  covers: number
  compact?: boolean
  className?: string
}

export function KpiStrip({
  reservations,
  covers,
  compact,
  className,
}: KpiStripProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-[3px] border border-hair bg-card",
        compact ? "gap-3.5 px-3.5 py-2.5" : "gap-6 px-[18px] py-3.5",
        className,
      )}
    >
      <Overline size={compact ? "xs" : "sm"} tone="mute">
        This week
      </Overline>
      <div className={cn("w-px bg-hair", compact ? "h-4" : "h-[18px]")} />
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-light tracking-[0.02em] text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          {reservations}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-soft">
          reservations
        </span>
      </div>
      <span className="font-extralight text-brand-ink-mute">·</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-light tracking-[0.02em] text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          {covers}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-soft">
          covers
        </span>
      </div>
    </div>
  )
}
