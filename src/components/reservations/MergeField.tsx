import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Check, GitMerge, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useFloorTables } from "@/contexts/TablesContext"

const LABEL =
  "block text-[10px] font-medium tracking-[0.22em] uppercase text-brand-ink-soft"

export interface MergeFieldProps {
  primaryTableId: string
  /** Full table set including the primary. */
  selected: string[]
  onChange: (tables: string[]) => void
  /** Candidate partner labels (already filtered to active siblings by parent). */
  siblings: string[]
  /** Lock the whole field (e.g. read-only edit modes). */
  disabled?: boolean
  /**
   * Optional per-sibling disable reasons — keyed by label. A sibling listed here
   * renders disabled with the reason as a small badge (e.g. "Occupied").
   * WalkInDialog uses this to surface currently-seated siblings.
   */
  disabledSiblings?: Record<string, string>
}

/**
 * Shared merge picker — used by ReservationForm and WalkInDialog. Renders a
 * dashed pill button that opens a popover listing the mergeable siblings; each
 * pick toggles the label in the parent's `selected` array (which always
 * includes the primary as index 0).
 */
export function MergeField({
  primaryTableId,
  selected,
  onChange,
  siblings,
  disabled,
  disabledSiblings,
}: MergeFieldProps) {
  const [open, setOpen] = React.useState(false)
  const { getTable } = useFloorTables()

  const mergedSibs = selected.filter((t) => t !== primaryTableId)

  function toggle(id: string) {
    if (disabledSiblings?.[id]) return
    const base = selected.includes(primaryTableId)
      ? selected
      : [primaryTableId, ...selected]
    onChange(base.includes(id) ? base.filter((t) => t !== id) : [...base, id])
  }

  return (
    <div>
      <span className={LABEL}>Merge tables</span>
      <div className="mt-[7px] flex flex-wrap items-center gap-2.5">
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={disabled || siblings.length === 0}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[3px] border border-dashed border-hair-strong bg-card px-3.5",
                "text-[11px] font-medium tracking-[0.18em] uppercase text-foreground transition-colors",
                "hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
                (disabled || siblings.length === 0) && "cursor-not-allowed opacity-60",
              )}
            >
              <GitMerge className="size-[13px]" strokeWidth={1.4} />
              {mergedSibs.length > 0
                ? `Merge: #${mergedSibs.join(", #")}`
                : siblings.length === 0
                  ? "No partners"
                  : "Add merge"}
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              sideOffset={6}
              align="start"
              className={cn(
                "z-[60] w-[260px] rounded-[3px] border border-hair-strong bg-popover p-2",
                "shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              )}
            >
              <div className="mb-1 border-b border-hair px-2 pt-1.5 pb-2 text-[10px] font-medium tracking-[0.22em] uppercase text-brand-ink-soft">
                Mergeable siblings
              </div>
              {siblings.map((sid) => {
                const def = getTable(sid)
                const isOn = selected.includes(sid)
                const disabledReason = disabledSiblings?.[sid]
                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => toggle(sid)}
                    disabled={!!disabledReason}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[2px] px-2 py-2.5 text-left transition-colors",
                      isOn && !disabledReason
                        ? "bg-primary/[0.06]"
                        : "hover:bg-foreground/[0.04]",
                      disabledReason && "cursor-not-allowed opacity-55 hover:bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-4 items-center justify-center rounded-[2px] border",
                        isOn && !disabledReason
                          ? "border-primary bg-primary"
                          : "border-hair-strong bg-card",
                      )}
                    >
                      {isOn && !disabledReason && (
                        <Check
                          className="size-2.5 text-primary-foreground"
                          strokeWidth={2}
                        />
                      )}
                    </span>
                    <span className="flex-1 text-[13px] font-light tracking-[0.02em] text-foreground">
                      Table #{sid}
                    </span>
                    {disabledReason ? (
                      <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase text-brand-ink-soft">
                        {disabledReason}
                      </span>
                    ) : (
                      <span className="text-[11px] tracking-[0.04em] text-brand-ink-soft">
                        seats {def?.capacity ?? 0}
                      </span>
                    )}
                  </button>
                )
              })}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        {mergedSibs.length > 0 && (
          <div className="inline-flex flex-wrap gap-1">
            {mergedSibs.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium tracking-[0.04em] text-primary"
              >
                #{s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  aria-label={`Remove table ${s} from merge`}
                  className="inline-flex"
                >
                  <X className="size-2.5" strokeWidth={1.6} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
