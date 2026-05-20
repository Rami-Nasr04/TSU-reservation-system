import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { CustomerList } from "@/components/customers/CustomerList"
import { CustomerDrawer } from "@/components/customers/CustomerDrawer"
import { FilterPills } from "@/components/customers/FilterPills"
import type { FilterPillOption } from "@/components/customers/FilterPills"
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog"
import { DeleteCustomerConfirm } from "@/components/customers/DeleteCustomerConfirm"
import { useCustomers } from "@/hooks/useCustomers"
import { formatDateISO, todayParts } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type {
  CustomerFilters,
  CustomerWithStats,
} from "@/services/customersService"

type FilterId = "all" | "vip" | "regulars" | "lapsed" | "new"

const FILTER_OPTIONS: FilterPillOption<FilterId>[] = [
  { id: "all", label: "All" },
  { id: "vip", label: "VIP" },
  { id: "regulars", label: "Regulars" },
  { id: "lapsed", label: "Lapsed" },
  { id: "new", label: "New" },
]

function toFilters(filter: FilterId): Pick<CustomerFilters, "vip" | "segment"> {
  switch (filter) {
    case "vip":
      return { vip: true }
    case "regulars":
      return { segment: "regulars" }
    case "lapsed":
      return { segment: "lapsed" }
    case "new":
      return { segment: "new" }
    default:
      return {}
  }
}

type Modal =
  | { kind: "none" }
  | { kind: "add" }
  | { kind: "edit"; customer: CustomerWithStats }
  | { kind: "delete"; customer: CustomerWithStats }

function useIsMobile(): boolean {
  const [mobile, setMobile] = React.useState<boolean>(() =>
    typeof window === "undefined" ? false : window.innerWidth < 640,
  )
  React.useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 640)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return mobile
}

export default function Customers() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [query, setQuery] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [filter, setFilter] = React.useState<FilterId>("all")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [modal, setModal] = React.useState<Modal>({ kind: "none" })

  // Debounce the search so we don't refetch on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, error, refetch } = useCustomers({
    search: debounced || undefined,
    sort: "last_visit_desc",
    ...toFilters(filter),
  })

  const customers = data ?? []
  const selected = selectedId
    ? (customers.find((c) => c.id === selectedId) ?? null)
    : null
  const vipCount = customers.filter((c) => c.vip).length
  const isFiltering = debounced.length > 0 || filter !== "all"

  function clearFilters() {
    setQuery("")
    setFilter("all")
  }

  function bookAgain() {
    const t = todayParts()
    navigate(`/day/${formatDateISO(t.year, t.month0, t.day)}`)
  }

  const headerCenter = (
    <span className="text-[15px] font-light tracking-[0.04em] text-foreground sm:text-[18px]">
      Customers
    </span>
  )
  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => setModal({ kind: "add" })}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-primary px-3 sm:px-3.5",
          "text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary-foreground",
          "transition-colors duration-150 hover:bg-brand-red-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <Plus className="size-3" />
        <span className="hidden sm:inline">New customer</span>
        <span className="sm:hidden">New</span>
      </button>
      <ThemeToggle />
    </>
  )

  return (
    <AppShell headerCenter={headerCenter} headerActions={headerActions} bare>
      <div className="flex h-[calc(100dvh-56px)] flex-col sm:h-[calc(100dvh-64px)]">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* List column */}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-3.5 p-3.5 sm:p-5",
              selected && !isMobile && "lg:max-w-[60%]",
            )}
          >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-ink-mute"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, phone, or email…"
                  className={cn(
                    "h-9 w-full rounded-[3px] bg-card pl-8 pr-3 text-[12.5px] font-light",
                    "border border-hair-strong text-foreground placeholder:text-brand-ink-mute",
                    "focus-visible:border-foreground focus-visible:outline-none",
                  )}
                />
              </div>
              <FilterPills
                options={FILTER_OPTIONS}
                active={filter}
                onChange={setFilter}
              />
              <span className="text-[11px] tracking-[0.04em] text-brand-ink-soft">
                {customers.length} {customers.length === 1 ? "guest" : "guests"}
                {vipCount > 0 && ` · ${vipCount} VIP`}
              </span>
            </div>

            {error && !data ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span className="text-[11.5px] text-brand-ink-soft">{error}</span>
                <button
                  type="button"
                  onClick={refetch}
                  className="rounded-full border border-hair-strong px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            ) : isLoading && !data ? (
              <div className="py-16 text-center text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
                Loading customers…
              </div>
            ) : (
              <CustomerList
                customers={customers}
                selectedId={selectedId}
                isMobile={isMobile}
                isFiltering={isFiltering}
                onSelect={(c) => setSelectedId(c.id)}
                onClearFilters={clearFilters}
              />
            )}
          </div>

          {/* Drawer — desktop split pane */}
          {selected && !isMobile && (
            <aside className="hidden w-[40%] min-w-[360px] max-w-[480px] shrink-0 border-l border-hair sm:block">
              <CustomerDrawer
                key={selected.id}
                customer={selected}
                onClose={() => setSelectedId(null)}
                onEdit={() => setModal({ kind: "edit", customer: selected })}
                onDelete={() => setModal({ kind: "delete", customer: selected })}
                onBookAgain={bookAgain}
                onPatched={refetch}
              />
            </aside>
          )}
        </div>

        {/* Drawer — mobile full-screen overlay */}
        {selected && isMobile && (
          <div className="fixed inset-0 z-50 bg-background">
            <CustomerDrawer
              key={selected.id}
              customer={selected}
              isMobile
              onClose={() => setSelectedId(null)}
              onEdit={() => setModal({ kind: "edit", customer: selected })}
              onDelete={() => setModal({ kind: "delete", customer: selected })}
              onBookAgain={bookAgain}
              onPatched={refetch}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      {modal.kind === "add" && (
        <AddCustomerDialog
          open
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}
      {modal.kind === "edit" && (
        <AddCustomerDialog
          open
          customer={modal.customer}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}
      {modal.kind === "delete" && (
        <DeleteCustomerConfirm
          open
          customer={modal.customer}
          onClose={() => setModal({ kind: "none" })}
          onDeleted={() => {
            setSelectedId(null)
            refetch()
          }}
        />
      )}
    </AppShell>
  )
}
