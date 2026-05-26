import { apiFetch } from "./apiClient"
import { invalidateTableIdMap } from "./reservationsService"
import type { TableSection } from "@/lib/tables"

/** Live table as returned by the backend (snake_case row). */
interface TableRow {
  id: number
  label: string
  capacity: number
  section: TableSection
  mergeable_group_id: number | null
  mergeable_with: number[]
  display_order: number
  active: boolean
}

/** UI-facing table shape (camelCase). `id` is the numeric PK; `label` is shown. */
export interface Table {
  id: number
  label: string
  capacity: number
  section: TableSection
  mergeableGroupId: number | null
  /** Explicit per-table whitelist of partner ids the host can merge with. */
  mergeableWith: number[]
  displayOrder: number
  active: boolean
}

export interface CreateTableInput {
  label: string
  capacity: number
  section: TableSection
  display_order: number
  /** Optional partner ids the new table should ship with. Same-section only. */
  mergeable_with?: number[]
}

export interface TablePatch {
  capacity?: number
  active?: boolean
  display_order?: number
  /** Full intended set of partner ids — backend writes symmetrically. Send [] to clear. */
  mergeable_with?: number[]
}

function adaptTable(row: TableRow): Table {
  return {
    id: row.id,
    label: row.label,
    capacity: row.capacity,
    section: row.section,
    mergeableGroupId: row.mergeable_group_id,
    mergeableWith: row.mergeable_with ?? [],
    displayOrder: row.display_order,
    active: row.active,
  }
}

/** Full table inventory, ordered by section then display order. */
export async function listTables(): Promise<Table[]> {
  const res = await apiFetch<TableRow[]>("/tables")
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load tables")
  }
  return res.data.map(adaptTable)
}

export async function createTable(input: CreateTableInput): Promise<Table> {
  const res = await apiFetch<TableRow>("/tables", {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to create table")
  }
  invalidateTableIdMap()
  return adaptTable(res.data)
}

/** Partial update — only the supplied keys are written (capacity/active/display_order). */
export async function patchTable(id: number, patch: TablePatch): Promise<Table> {
  const res = await apiFetch<TableRow>(`/tables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to update table")
  }
  invalidateTableIdMap()
  return adaptTable(res.data)
}

/**
 * Hard-delete. 409 if any reservation still references the table (FK).
 *
 * `mergeable_with` is symmetric but the backend does NOT auto-cleanup partner
 * arrays on delete — so first PATCH partners to [] to strip this id from every
 * sibling, then DELETE the row.
 */
export async function deleteTable(id: number): Promise<void> {
  await patchTable(id, { mergeable_with: [] }).catch(() => {
    // Non-fatal: partners may already be empty, or the PATCH may race. The
    // DELETE is the authoritative step — if cleanup fails, orphan ids in
    // partners' arrays will resolve to nothing client-side (we filter unknowns).
  })
  const res = await apiFetch<{ deleted: boolean }>(`/tables/${id}`, {
    method: "DELETE",
  })
  if (!res.success) {
    if (res.error?.code === "CONFLICT") {
      throw new Error(
        "Cannot delete — table is used by a reservation. Remove those first.",
      )
    }
    throw new Error(res.error?.message ?? "Failed to delete table")
  }
  invalidateTableIdMap()
}
