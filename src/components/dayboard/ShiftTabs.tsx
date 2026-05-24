import { cn } from "@/lib/utils"
import type { ShiftSummary, ShiftId } from "@/services/reservationsService"

export type ActiveShift = ShiftId | "all"

interface ShiftTabsProps {
  active: ActiveShift
  onChange: (next: ActiveShift) => void
  shifts: ShiftSummary[]
  isMobile?: boolean
}

export function ShiftTabs({
  active,
  onChange,
  shifts,
  isMobile,
}: ShiftTabsProps) {
  return (
    <div
      className={cn(
        "sticky top-14 sm:top-16 z-[9] flex gap-1 sm:gap-1",
        "whitespace-nowrap overflow-x-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "border-b border-hair bg-background/90 backdrop-blur-md backdrop-saturate-[1.4]",
        isMobile ? "px-3 py-2" : "px-7 py-2.5",
      )}
    >
      {shifts.map((s) => {
        const isActive = s.id === active
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "inline-flex items-center gap-2 border-b-2",
              isActive ? "border-primary" : "border-transparent",
              isMobile ? "px-3 pt-2 pb-2.5" : "px-4 pt-2.5 pb-3",
              isActive
                ? "text-foreground"
                : "text-brand-ink-soft hover:text-foreground",
              "transition-colors duration-150 focus-visible:outline-none",
            )}
          >
            <span
              className={cn(
                "uppercase tracking-[0.16em]",
                isMobile ? "text-[11px]" : "text-[12px]",
                isActive ? "font-medium" : "font-normal",
              )}
            >
              {s.label}
            </span>
            {s.hours && (
              <span className="text-[10px] lowercase tracking-[0.04em] text-brand-ink-mute">
                {s.hours}
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-medium leading-none tracking-[0.04em]",
                "min-w-[20px] h-[18px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-brand-ink-soft",
              )}
            >
              {s.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
