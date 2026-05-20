import { ChevronRight, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CustomerWithStats } from "@/services/customersService"
import { CustomerAvatar } from "./CustomerAvatar"
import { CUSTOMER_GRID, displayName, formatDayLabel, formatMoney } from "./format"

interface CustomerRowProps {
  customer: CustomerWithStats
  selected: boolean
  isMobile?: boolean
  onClick: () => void
}

export function CustomerRow({
  customer: c,
  selected,
  isMobile,
  onClick,
}: CustomerRowProps) {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 border-t border-hair px-4 py-3.5 text-left",
          "transition-colors duration-150 hover:bg-muted/50",
          selected && "bg-primary/5",
        )}
      >
        <CustomerAvatar name={c.name} vip={c.vip} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] tracking-[0.02em] text-foreground">
            {displayName(c)}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-brand-ink-soft">
            {c.phone ?? "No phone"}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[13px] tabular-nums text-foreground">
            {formatMoney(c.lifetimeSpend)}
          </span>
          <span className="mt-0.5 block text-[10px] tracking-[0.06em] text-brand-ink-mute">
            {c.visitCount} visits
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full items-center border-t border-hair px-[18px] py-3.5 text-left",
        CUSTOMER_GRID,
        "transition-colors duration-150 hover:bg-muted/50",
        selected && "bg-primary/5",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <CustomerAvatar name={c.name} vip={c.vip} />
        <span className="min-w-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="truncate text-[13.5px] tracking-[0.02em] text-foreground">
              {displayName(c)}
            </span>
            {c.vip && (
              <Star className="size-2.5 shrink-0 fill-brand-gold text-brand-gold" />
            )}
          </span>
          {c.tags[0] && (
            <span className="mt-0.5 block truncate text-[10.5px] tracking-[0.04em] text-brand-ink-mute">
              {c.tags[0]}
            </span>
          )}
        </span>
      </span>
      <span className="min-w-0 text-[11.5px] text-brand-ink-soft">
        <span className="block truncate">{c.phone ?? "—"}</span>
        <span className="mt-0.5 block truncate">{c.email ?? "—"}</span>
      </span>
      <span className="text-right text-[13px] tabular-nums text-foreground">
        {c.visitCount}
      </span>
      <span className="text-right text-[13px] tabular-nums text-foreground">
        {formatMoney(c.lifetimeSpend)}
      </span>
      <span className="text-[11.5px] tracking-[0.02em] text-brand-ink-soft">
        {formatDayLabel(c.lastVisit)}
      </span>
      <span className="flex justify-end text-brand-ink-mute">
        <ChevronRight className="size-3.5" />
      </span>
    </button>
  )
}
