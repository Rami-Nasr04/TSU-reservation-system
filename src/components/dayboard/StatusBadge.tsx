import { cn } from "@/lib/utils"
import type { ReservationStatus } from "@/services/reservationsService"
import { STATUS_STYLE } from "./statusStyle"

interface StatusBadgeProps {
  status: ReservationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[2px]",
        "text-[10px] font-medium uppercase tracking-[0.12em]",
        meta.textClass,
        meta.bgClass,
      )}
    >
      <span aria-hidden className={cn("size-1 rounded-full", meta.dotClass)} />
      {meta.label}
    </span>
  )
}
