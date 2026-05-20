import { cn } from "@/lib/utils"
import type { CustomerWithStats } from "@/services/customersService"
import { CustomerRow } from "./CustomerRow"
import { CUSTOMER_GRID } from "./format"

interface CustomerListProps {
  customers: CustomerWithStats[]
  selectedId: string | null
  isMobile?: boolean
  isFiltering?: boolean
  onSelect: (c: CustomerWithStats) => void
  onClearFilters?: () => void
}

export function CustomerList({
  customers,
  selectedId,
  isMobile,
  isFiltering,
  onSelect,
  onClearFilters,
}: CustomerListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-[3px] border border-hair bg-background">
      {!isMobile && (
        <div
          className={cn(
            "sticky top-0 z-10 grid gap-x-3 bg-foreground/[0.025] px-[18px] py-3",
            CUSTOMER_GRID,
            "text-[10px] font-medium uppercase tracking-[0.24em] text-brand-ink-soft",
          )}
        >
          <span>Guest</span>
          <span>Contact</span>
          <span className="text-right">Visits</span>
          <span className="text-right">Lifetime $</span>
          <span>Last visit</span>
          <span />
        </div>
      )}

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <span className="text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
            No customers{isFiltering ? " match this filter" : " yet"}.
          </span>
          {isFiltering && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className={cn(
                "rounded-full border border-hair-strong px-3 py-1",
                "text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft",
                "transition-colors duration-150 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        customers.map((c) => (
          <CustomerRow
            key={c.id}
            customer={c}
            isMobile={isMobile}
            selected={c.id === selectedId}
            onClick={() => onSelect(c)}
          />
        ))
      )}
    </div>
  )
}
