import { cn } from "@/lib/utils"
import { formatTime12 } from "@/lib/dates"
import type { ReservationItem } from "@/services/reservationsService"

interface ReservationChipProps {
  item: ReservationItem
  muted?: boolean
  compact?: boolean
}

export function ReservationChip({
  item,
  muted,
  compact,
}: ReservationChipProps) {
  return (
    <div
      className={cn(
        "truncate rounded-[2px] border border-hair bg-card/80 leading-[1.3] tracking-[0.02em]",
        compact ? "px-1.5 py-[1px] text-[10px]" : "px-1.5 py-[2px] text-[10.5px]",
        muted ? "text-brand-ink-mute" : "text-foreground",
      )}
    >
      <span
        className={cn(
          "mr-1.5 font-medium",
          muted ? "text-brand-ink-mute" : "text-primary",
        )}
      >
        {formatTime12(item.time)}
      </span>
      <span>{item.name}</span>
    </div>
  )
}
