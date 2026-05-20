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
  displayOrder: number
  active: boolean
}

export interface CreateTableInput {
  label: string
  capacity: number
  section: TableSection
  mergeable_group_id: number | null
  display_order: number
}

export interface TablePatch {
  capacity?: number
  active?: boolean
  display_order?: number
}

function adaptTable(row: TableRow): Table {
  return {
    id: row.id,
    label: row.label,
    capacity: row.capacity,
    section: row.section,
    mergeableGroupId: row.mergeable_group_id,
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

/** Hard-delete. 409 if any reservation still references the table (FK). */
export async function deleteTable(id: number): Promise<void> {
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
