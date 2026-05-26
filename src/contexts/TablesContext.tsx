import * as React from "react"

import { useTables } from "@/hooks/useTables"
import { ALL_TABLES, type TableDef, type TableSection } from "@/lib/tables"
import type { Table } from "@/services/tablesService"

/** Floor-facing table shape: the static `TableDef` plus live fields. */
export interface FloorTable extends TableDef {
  active: boolean
  /** Backend numeric PK. Null when serving the static fallback. */
  numericId: number | null
  /** Resolved partner labels — used by merge UI. Inactive partners filtered. */
  mergeableWith: string[]
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

/**
 * Resolve numeric partner ids to labels. Backend stores `mergeable_with` as
 * numeric ids; the floor + merge picker work in labels. Inactive partners are
 * filtered — they shouldn't appear in any merge picker.
 */
function resolvePartners(
  partnerIds: number[],
  byNumericId: Map<number, Table>,
): string[] {
  const out: string[] = []
  for (const pid of partnerIds) {
    const t = byNumericId.get(pid)
    if (t && t.active) out.push(t.label)
  }
  return out
}

/** Live tables adapted to the floor shape, with partner labels pre-resolved. */
function adaptAll(data: Table[]): FloorTable[] {
  const byNumericId = new Map(data.map((t) => [t.id, t]))
  return [...data]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((t) => ({
      id: t.label,
      section: t.section,
      capacity: t.capacity,
      mergeableGroupId: t.mergeableGroupId != null ? String(t.mergeableGroupId) : null,
      displayOrder: t.displayOrder,
      active: t.active,
      numericId: t.id,
      mergeableWith: resolvePartners(t.mergeableWith, byNumericId),
    }))
}

/**
 * Static snapshot used until the live list lands (and if it fails). Mergeable
 * partners are derived from the legacy group ids so the merge picker still works
 * during the fallback window.
 */
const FALLBACK: FloorTable[] = (() => {
  const all = ALL_TABLES.map((t) => ({
    ...t,
    active: true,
    numericId: null as number | null,
    mergeableWith: [] as string[],
  }))
  for (const t of all) {
    if (!t.mergeableGroupId) continue
    t.mergeableWith = all
      .filter((other) => other.mergeableGroupId === t.mergeableGroupId && other.id !== t.id)
      .map((other) => other.id)
  }
  return all
})()

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
    const tables = isFallback ? FALLBACK : adaptAll(data)
    const index = new Map(tables.map((t) => [t.id, t]))

    return {
      tables,
      isLoading,
      error,
      isFallback,
      refetch,
      getTable: (label) => index.get(label),
      getMergeableSiblings: (label) => index.get(label)?.mergeableWith ?? [],
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
