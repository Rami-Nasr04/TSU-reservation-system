import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface Rule {
  test: (s: string) => boolean
  label: string
}

const RULES: Rule[] = [
  { test: (s) => s.length >= 8, label: "At least 8 characters" },
  { test: (s) => /\d/.test(s), label: "Contains a number" },
  { test: (s) => /[^A-Za-z0-9]/.test(s), label: "Contains a symbol" },
]

const LEVEL_META = {
  weak: {
    label: "Weak",
    segs: 1,
    textClass: "text-destructive",
    barClass: "bg-destructive",
  },
  fair: {
    label: "Fair",
    segs: 2,
    textClass: "text-brand-gold-deep",
    barClass: "bg-brand-gold",
  },
  strong: {
    label: "Strong",
    segs: 3,
    textClass: "text-brand-positive",
    barClass: "bg-brand-positive",
  },
} as const

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const met = RULES.map((r) => r.test(password))
  const passed = met.filter(Boolean).length
  const level: keyof typeof LEVEL_META =
    passed >= 3 ? "strong" : passed === 2 ? "fair" : "weak"
  const meta = LEVEL_META[level]

  return (
    <div className={cn("flex flex-col gap-2 mt-2", className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-[3px] flex-1 rounded-[2px]",
                i < meta.segs ? meta.barClass : "bg-hair-strong",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.22em]",
            meta.textClass,
          )}
        >
          {meta.label}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {RULES.map((r, i) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-2 text-[11.5px] tracking-[0.02em]",
              met[i] ? "text-brand-positive" : "text-brand-ink-mute",
            )}
          >
            <span
              className={cn(
                "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full",
                met[i] ? "bg-brand-positive/15" : "bg-hair-strong",
              )}
            >
              {met[i] ? (
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
              ) : (
                <span className="h-1 w-1 rounded-full bg-brand-ink-mute" />
              )}
            </span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function isStrongPassword(password: string): boolean {
  return RULES.every((r) => r.test(password))
}
