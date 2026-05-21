import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import type { TablePerf } from "@/services/analyticsService"
import { cn } from "@/lib/utils"
import { AnalyticsCard } from "./AnalyticsCard"
import { formatCurrency } from "./format"

interface TablePerfTableProps {
  data: TablePerf[]
}

type SortKey = "label" | "section" | "reservations" | "revenue" | "avgPax" | "tips"
type SortDir = "asc" | "desc"

const NUMERIC: Set<SortKey> = new Set(["reservations", "revenue", "avgPax", "tips"])

/** Per-table aggregates — sortable table on desktop, top-8 stacked on mobile. */
export function TablePerfTable({ data }: TablePerfTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("revenue")
  const [dir, setDir] = React.useState<SortDir>("desc")

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      if (NUMERIC.has(sortKey)) {
        const av = a[sortKey] as number
        const bv = b[sortKey] as number
        return dir === "asc" ? av - bv : bv - av
      }
      const av = String(a[sortKey])
      const bv = String(b[sortKey])
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [data, sortKey, dir])

  function toggle(k: SortKey) {
    if (k === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(k)
      setDir(NUMERIC.has(k) ? "desc" : "asc")
    }
  }

  if (data.length === 0) {
    return (
      <AnalyticsCard title="Table Performance" subtitle="By revenue, descending">
        <EmptyHint />
      </AnalyticsCard>
    )
  }

  return (
    <AnalyticsCard
      title="Table Performance"
      subtitle="Sortable · tap a column header"
      noPad
    >
      {/* Mobile: top-8 stacked cards */}
      <div className="flex flex-col gap-2 p-3.5 sm:hidden">
        {sorted.slice(0, 8).map((t, i) => (
          <div
            key={t.tableId}
            className="rounded-[3px] border border-hair bg-brand-paper-warm p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2.5">
              <span className="inline-flex items-baseline gap-2">
                <span className="min-w-[18px] text-[11px] font-medium tracking-[0.08em] text-brand-ink-mute tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] tracking-[0.02em] text-foreground">
                  {t.label}
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-brand-ink-mute">
                  {t.section}
                </span>
              </span>
              <span className="text-[15px] text-foreground tabular-nums">
                {formatCurrency(t.revenue)}
              </span>
            </div>
            <div className="flex gap-3.5 text-[11px] tracking-[0.02em] text-brand-ink-soft">
              <span>
                <span className="text-foreground">{t.reservations}</span> res.
              </span>
              <span>
                PAX <span className="text-foreground">{t.avgPax.toFixed(1)}</span>
              </span>
              <span>
                Tips{" "}
                <span className="text-foreground">{formatCurrency(t.tips)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: full sortable table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-foreground/[0.025]">
              <Th>Rank</Th>
              <Th sortKey="label" active={sortKey} dir={dir} onSort={toggle}>
                Table
              </Th>
              <Th sortKey="section" active={sortKey} dir={dir} onSort={toggle}>
                Section
              </Th>
              <Th sortKey="reservations" active={sortKey} dir={dir} onSort={toggle} align="right">
                Reservations
              </Th>
              <Th sortKey="revenue" active={sortKey} dir={dir} onSort={toggle} align="right">
                Revenue
              </Th>
              <Th sortKey="avgPax" active={sortKey} dir={dir} onSort={toggle} align="right">
                Avg PAX
              </Th>
              <Th sortKey="tips" active={sortKey} dir={dir} onSort={toggle} align="right">
                Tips
              </Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.tableId} className="border-t border-hair">
                <Td className="w-[52px] text-brand-ink-mute tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </Td>
                <Td className="text-foreground">{t.label}</Td>
                <Td className="text-[10.5px] uppercase tracking-[0.18em] text-brand-ink-soft">
                  {t.section}
                </Td>
                <Td align="right" className="tabular-nums">
                  {t.reservations}
                </Td>
                <Td align="right" className="font-normal text-foreground tabular-nums">
                  {formatCurrency(t.revenue)}
                </Td>
                <Td align="right" className="tabular-nums">
                  {t.avgPax.toFixed(1)}
                </Td>
                <Td align="right" className="tabular-nums">
                  {formatCurrency(t.tips)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnalyticsCard>
  )
}

function EmptyHint() {
  return (
    <div className="py-10 text-center text-[11.5px] tracking-[0.02em] text-brand-ink-mute">
      No completed reservations in this range.
    </div>
  )
}

interface ThProps {
  children: React.ReactNode
  sortKey?: SortKey
  active?: SortKey
  dir?: SortDir
  onSort?: (k: SortKey) => void
  align?: "left" | "right"
}

function Th({ children, sortKey, active, dir, onSort, align = "left" }: ThProps) {
  const sortable = sortKey != null && onSort != null
  const isActive = sortable && active === sortKey
  return (
    <th
      onClick={sortable ? () => onSort(sortKey) : undefined}
      className={cn(
        "select-none whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.22em]",
        align === "right" ? "text-right" : "text-left",
        isActive ? "text-foreground" : "text-brand-ink-soft",
        sortable && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        {sortable &&
          (isActive ? (
            dir === "asc" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )
          ) : (
            <ChevronsUpDown className="size-3 text-brand-ink-mute" />
          ))}
      </span>
    </th>
  )
}

interface TdProps {
  children: React.ReactNode
  align?: "left" | "right"
  className?: string
}

function Td({ children, align = "left", className }: TdProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] font-light tracking-[0.02em] text-brand-ink-soft",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  )
}
