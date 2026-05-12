import { cn } from "@/lib/utils"

const LONG = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
const SHORT = ["M", "T", "W", "T", "F", "S", "S"] as const

interface WeekHeaderProps {
  compact?: boolean
}

export function WeekHeader({ compact }: WeekHeaderProps) {
  const labels = compact ? SHORT : LONG
  return (
    <div className="grid grid-cols-7 border-b border-hair">
      {labels.map((l, i) => (
        <div
          key={i}
          className={cn(
            "text-[10px] sm:text-[10.5px] font-medium uppercase tracking-[0.24em]",
            compact ? "py-2 text-center" : "py-3 px-3.5",
            i === 5 || i === 6
              ? "text-foreground"
              : "text-brand-ink-soft",
          )}
        >
          {l}
        </div>
      ))}
    </div>
  )
}
