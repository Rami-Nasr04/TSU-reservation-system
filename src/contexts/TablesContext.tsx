import * as React from "react"

import { useTables } from "@/hooks/useTables"
import { ALL_TABLES, type TableDef, type TableSection } from "@/lib/tables"
import type { Table } from "@/services/tablesService"

/** Floor-facing table shape: the static `TableDef` plus the live `active` flag. */
export interface FloorTable extends TableDef {
  active: boolean
}

interface TablesContextValue {
  /** Every table (active + inactive), in display order. */
  tables: FloorTable[]
  isLoading: boolean
  error: string | null
  /** True when serving the static `lib/tables.ts` snapshot (fetch empty/failed). */
  isFallback: boolean
  refetch: () => void
  getTable: (label: string) => FloorTable | undefined
  getMergeableSiblings: (label: string) => string[]
  bySection: (
    section: TableSection,
    opts?: { activeOnly?: boolean },
  ) => FloorTable[]
}

const TablesContext = React.createContext<TablesContextValue | null>(null)

/** Live tables adapted to the floor shape (number ids → label/group strings). */
function adapt(t: Table): FloorTable {
  return {
    id: t.label,
    section: t.section,
    capacity: t.capacity,
    mergeableGroupId: t.mergeableGroupId != null ? String(t.mergeableGroupId) : null,
    displayOrder: t.displayOrder,
    active: t.active,
  }
}

/** Static snapshot used until the live list lands (and if it fails). */
const FALLBACK: FloorTable[] = ALL_TABLES.map((t) => ({ ...t, active: true }))

interface TablesProviderProps {
  children: React.ReactNode
}

/**
 * Shares the live table inventory across the floor (FloorView, ReservationForm).
 * Falls back to `lib/tables.ts` so the board still renders if `GET /tables`
 * fails on boot. Settings owns its own `useTables()` for CRUD; this is read-only.
 */
export function TablesProvider({ children }: TablesProviderProps) {
  const { data, isLoading, error, refetch } = useTables()

  const value = React.useMemo<TablesContextValue>(() => {
    const isFallback = !data || data.length === 0
    const tables = isFallback
      ? FALLBACK
      : [...data]
          .map(adapt)
          .sort((a, b) => a.displayOrder - b.displayOrder)
    const index = new Map(tables.map((t) => [t.id, t]))

    return {
      tables,
      isLoading,
      error,
      isFallback,
      refetch,
      getTable: (label) => index.get(label),
      getMergeableSiblings: (label) => {
        const def = index.get(label)
        if (!def?.mergeableGroupId) return []
        return tables
          .filter(
            (t) => t.mergeableGroupId === def.mergeableGroupId && t.id !== label,
          )
          .map((t) => t.id)
      },
      bySection: (section, opts) =>
        tables.filter(
          (t) => t.section === section && (!opts?.activeOnly || t.active),
        ),
    }
  }, [data, isLoading, error, refetch])

  return (
    <TablesContext.Provider value={value}>{children}</TablesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFloorTables(): TablesContextValue {
  const ctx = React.useContext(TablesContext)
  if (!ctx) {
    throw new Error("useFloorTables must be used within a TablesProvider")
  }
  return ctx
}
