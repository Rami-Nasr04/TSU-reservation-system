import { cn } from "@/lib/utils"

interface ToggleProps {
  on: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
}

/** 34×20 switch. Brand-tokened: red track when on, muted when off. */
export function Toggle({ on, onChange, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-primary" : "bg-foreground/20",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow-sm transition-transform duration-150",
          on ? "translate-x-[16px]" : "translate-x-0.5",
        )}
      />
    </button>
  )
}
