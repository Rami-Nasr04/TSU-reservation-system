import { CalendarDays } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnalyticsRange } from "@/services/analyticsService"
import { RANGE_OPTIONS, rangeDateLabel } from "./format"

type PresetRange = Extract<AnalyticsRange, string>

interface RangePickerProps {
  value: PresetRange
  onChange: (value: PresetRange) => void
}

/**
 * Range preset selector. Radix Select (never a native `<select>`) so it themes
 * with the brand tokens and works in dark mode. Custom date ranges are supported
 * by the service/backend but a date-range UI is out of P5 scope.
 */
export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PresetRange)}>
      <SelectTrigger
        size="default"
        className="h-9 gap-2 rounded-[3px] border-hair-strong bg-card px-3 text-[12px] font-normal tracking-[0.04em] text-foreground"
      >
        <CalendarDays className="size-3.5 text-brand-ink-soft" strokeWidth={1.4} />
        <SelectValue />
        <span className="hidden text-brand-ink-mute sm:inline">
          · {rangeDateLabel(value)}
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="rounded-[3px]">
        {RANGE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[12.5px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
