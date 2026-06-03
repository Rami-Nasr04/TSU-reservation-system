import * as React from "react"
import { cn } from "@/lib/utils"

interface DigitInputProps {
  value: string
  onChange: (next: string) => void
  onComplete?: (full: string) => void
  autoFocus?: boolean
  disabled?: boolean
  className?: string
}

const LENGTH = 6

export function DigitInput({
  value,
  onChange,
  onComplete,
  autoFocus,
  disabled,
  className,
}: DigitInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([])

  React.useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const setIndex = (idx: number, char: string) => {
    if (!/^[0-9]?$/.test(char)) return
    const arr = (value.padEnd(LENGTH, " ").split("") as string[]).map((c) =>
      c === " " ? "" : c,
    )
    arr[idx] = char
    const next = arr.join("").trimEnd().slice(0, LENGTH)
    onChange(next)
    if (char && idx < LENGTH - 1) refs.current[idx + 1]?.focus()
    if (next.length === LENGTH) onComplete?.(next)
  }

  const handleChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (v.length > 1) {
        const digits = v.replace(/\D/g, "").slice(0, LENGTH - idx)
        const merged = (value + digits).slice(0, LENGTH)
        onChange(merged)
        const focusIdx = Math.min(merged.length, LENGTH - 1)
        refs.current[focusIdx]?.focus()
        if (merged.length === LENGTH) onComplete?.(merged)
        return
      }
      setIndex(idx, v)
    }

  const handleKeyDown =
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        const current = value[idx] ?? ""
        if (!current && idx > 0) {
          e.preventDefault()
          const arr = value.split("")
          arr[idx - 1] = ""
          const next = arr.join("").trimEnd()
          onChange(next)
          refs.current[idx - 1]?.focus()
        }
      } else if (e.key === "ArrowLeft" && idx > 0) {
        refs.current[idx - 1]?.focus()
      } else if (e.key === "ArrowRight" && idx < LENGTH - 1) {
        refs.current[idx + 1]?.focus()
      }
    }

  const handlePaste =
    (idx: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData("text") ?? ""
      const digits = text.replace(/\D/g, "").slice(0, LENGTH)
      if (!digits) return
      const merged = (value.slice(0, idx) + digits).slice(0, LENGTH)
      onChange(merged)
      const focusIdx = Math.min(merged.length, LENGTH - 1)
      refs.current[focusIdx]?.focus()
      if (merged.length === LENGTH) onComplete?.(merged)
    }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 sm:gap-3",
        className,
      )}
    >
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          role="textbox"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
          disabled={disabled}
          className={cn(
            "h-11 w-10 sm:h-12 sm:w-11 rounded-[3px] border border-hair-strong bg-card",
            "text-center text-base font-medium tabular-nums tracking-[0.02em] text-foreground",
            "focus:outline-none focus:border-foreground focus:ring-[3px] focus:ring-foreground/10",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        />
      ))}
    </div>
  )
}
