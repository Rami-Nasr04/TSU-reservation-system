import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface CapacityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  disabled?: boolean
  compact?: boolean
}

/** Squared ±/− stepper for table capacity. Clamps to [min, max]. */
export function CapacityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled,
  compact,
}: CapacityStepperProps) {
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta))
    if (next !== value) onChange(next)
  }
  const btn = cn(
    "inline-flex h-full items-center justify-center text-brand-ink-soft",
    "transition-colors duration-150 hover:text-foreground",
    "disabled:cursor-not-allowed disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
    compact ? "w-6" : "w-7",
  )

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-[3px] border border-hair-strong bg-card",
        compact ? "h-7" : "h-8",
      )}
    >
      <button
        type="button"
        aria-label="Decrease capacity"
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
        className={cn(btn, "border-r border-hair")}
      >
        <Minus className="size-3" />
      </button>
      <span
        className={cn(
          "px-2 text-center tabular-nums text-foreground",
          compact ? "min-w-7 text-[12.5px]" : "min-w-9 text-[13.5px]",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase capacity"
        onClick={() => step(1)}
        disabled={disabled || value >= max}
        className={cn(btn, "border-l border-hair")}
      >
        <Plus className="size-3" />
      </button>
    </div>
  )
}
