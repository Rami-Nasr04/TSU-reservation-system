import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { ChevronDown, Phone } from "lucide-react"
import { AsYouType, getCountryCallingCode, type CountryCode } from "libphonenumber-js"

import { cn } from "@/lib/utils"
import { usePopoverScrollFix } from "@/lib/popoverScroll"
import { COUNTRY_OPTIONS, isPhoneValid, parseE164 } from "@/lib/phone"

interface PhoneFieldProps {
  /** Canonical E.164 (e.g. "+9613662794") or "" when empty. */
  value: string
  onChange: (e164: string) => void
  disabled?: boolean
  /** Applied to the national-number input so an external <label htmlFor> can associate. */
  id?: string
}

export function PhoneField({ value, onChange, disabled, id }: PhoneFieldProps) {
  // Seed once from the incoming E.164 (modals remount via key — no sync effect needed).
  const [country, setCountry] = React.useState<CountryCode>(() => parseE164(value).country)
  const [national, setNational] = React.useState<string>(() => parseE164(value).national)
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const scrollFix = usePopoverScrollFix()

  const callingCode = getCountryCallingCode(country)
  const showHint = value.trim() !== "" && !isPhoneValid(value)

  function emit(nextCountry: CountryCode, rawNational: string) {
    const ayt = new AsYouType(nextCountry)
    const display = ayt.input(rawNational)
    setNational(display)
    const num = ayt.getNumber()
    const digits = rawNational.replace(/\D/g, "")
    onChange(num ? num.number : digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : "")
  }

  function handleNationalChange(raw: string) {
    emit(country, raw)
  }

  function handleCountryPick(next: CountryCode) {
    setCountry(next)
    setOpen(false)
    setSearch("")
    emit(next, national) // keep typed digits, re-prefix with the new calling code
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRY_OPTIONS
    const digits = q.replace(/\D/g, "")
    return COUNTRY_OPTIONS.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (digits !== "" && o.callingCode.includes(digits)),
    )
  }, [search])

  return (
    <div>
      <div
        className={cn(
          "relative flex h-10 items-center rounded-[3px] border bg-card transition-colors",
          "focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-foreground/[0.06]",
          showHint ? "border-brand-gold/40" : "border-hair-strong",
        )}
      >
        <PopoverPrimitive.Root
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setSearch("")
          }}
        >
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Select country code"
              className={cn(
                "flex h-full items-center gap-1.5 rounded-l-[3px] pl-3 pr-2.5",
                "transition-colors hover:bg-foreground/[0.03]",
                "focus-visible:outline-none",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Phone className="size-[13px] text-brand-ink-mute" strokeWidth={1.4} />
              <span className="text-[13px] font-light tabular-nums text-foreground">
                +{callingCode}
              </span>
              <ChevronDown className="size-3 text-brand-ink-mute" strokeWidth={1.4} />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              sideOffset={6}
              align="start"
              className={cn(
                "z-[60] w-[300px] rounded-[3px] border border-hair-strong bg-popover shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              )}
            >
              <div className="border-b border-hair p-2">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code…"
                  className={cn(
                    "h-8 w-full rounded-[2px] bg-foreground/[0.03] px-2.5",
                    "text-[12.5px] font-light tracking-[0.02em] text-foreground placeholder:text-brand-ink-mute",
                    "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-foreground/[0.06]",
                  )}
                />
              </div>
              <div
                ref={scrollFix}
                className="max-h-[260px] overflow-y-auto touch-pan-y overscroll-contain p-1"
              >
                {filtered.map((o) => (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => handleCountryPick(o.code)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-[2px] px-2.5 text-left",
                      "transition-colors hover:bg-foreground/[0.04]",
                      o.code === country && "bg-foreground/[0.05]",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-light tracking-[0.02em] text-foreground">
                      {o.name}
                    </span>
                    <span className="text-[12px] tabular-nums text-brand-ink-soft">
                      +{o.callingCode}
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-2.5 py-3 text-center text-[12px] text-brand-ink-mute">
                    No match
                  </div>
                )}
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        <span className="h-5 w-px shrink-0 bg-hair-strong" />

        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={national}
          onChange={(e) => handleNationalChange(e.target.value)}
          placeholder="3 662 794"
          disabled={disabled}
          className={cn(
            "h-full flex-1 bg-transparent px-2.5 text-[13px] font-light tracking-[0.02em] text-foreground outline-none",
            "placeholder:text-brand-ink-mute",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      </div>
      {showHint && (
        <div className="mt-1.5 text-[11px] tracking-[0.02em] text-brand-ink-soft">
          Enter a complete phone number, or leave it blank.
        </div>
      )}
    </div>
  )
}
