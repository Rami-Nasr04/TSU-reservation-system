import { cn } from "@/lib/utils"

interface CounterChipProps {
  label: string
  value: number
  accent?: boolean
  dotColor?: string
}

export function CounterChip({ label, value, accent, dotColor }: CounterChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1",
        accent ? "bg-muted border border-transparent" : "border border-hair",
      )}
    >
      {dotColor && (
        <span
          aria-hidden
          className="self-center size-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      <span className="text-[13px] font-medium tracking-[0.02em] text-foreground">
        {value}
      </span>
      <span className="text-[10.5px] tracking-[0.06em] text-brand-ink-soft">
        {label}
      </span>
    </div>
  )
}
