export type TableSection = "bar" | "indoor" | "terrace"

export interface TableDef {
  /** Label as shown to staff ("1" for bar seats, "20", "60", etc.). */
  id: string
  section: TableSection
  capacity: number
  /** Same string id for tables that can be merged together. Null = not mergeable. */
  mergeableGroupId: string | null
  /** Sort order within the section. */
  displayOrder: number
}

const INDOOR_MERGE = "indoor-A"
const TERRACE_MERGE = "terrace-B"

export const BAR_TABLES: TableDef[] = Array.from({ length: 14 }, (_, i) => ({
  id: String(i + 1),
  section: "bar",
  capacity: 1,
  mergeableGroupId: null,
  displayOrder: i + 1,
}))

export const INDOOR_TABLES: TableDef[] = [
  { id: "20", section: "indoor", capacity: 3, mergeableGroupId: INDOOR_MERGE, displayOrder: 1 },
  { id: "21", section: "indoor", capacity: 2, mergeableGroupId: INDOOR_MERGE, displayOrder: 2 },
  { id: "22", section: "indoor", capacity: 2, mergeableGroupId: INDOOR_MERGE, displayOrder: 3 },
  { id: "24", section: "indoor", capacity: 3, mergeableGroupId: INDOOR_MERGE, displayOrder: 4 },
  { id: "26", section: "indoor", capacity: 4, mergeableGroupId: null,         displayOrder: 5 },
  { id: "28", section: "indoor", capacity: 4, mergeableGroupId: null,         displayOrder: 6 },
  { id: "40", section: "indoor", capacity: 5, mergeableGroupId: null,         displayOrder: 7 },
  { id: "41", section: "indoor", capacity: 5, mergeableGroupId: null,         displayOrder: 8 },
  { id: "42", section: "indoor", capacity: 5, mergeableGroupId: null,         displayOrder: 9 },
  { id: "44", section: "indoor", capacity: 2, mergeableGroupId: null,         displayOrder: 10 },
  { id: "46", section: "indoor", capacity: 2, mergeableGroupId: null,         displayOrder: 11 },
  { id: "48", section: "indoor", capacity: 2, mergeableGroupId: null,         displayOrder: 12 },
  { id: "50", section: "indoor", capacity: 3, mergeableGroupId: null,         displayOrder: 13 },
]

export const TERRACE_TABLES: TableDef[] = [
  { id: "60", section: "terrace", capacity: 2, mergeableGroupId: TERRACE_MERGE, displayOrder: 1 },
  { id: "61", section: "terrace", capacity: 2, mergeableGroupId: TERRACE_MERGE, displayOrder: 2 },
  { id: "62", section: "terrace", capacity: 2, mergeableGroupId: TERRACE_MERGE, displayOrder: 3 },
  { id: "64", section: "terrace", capacity: 4, mergeableGroupId: null,         displayOrder: 4 },
  { id: "66", section: "terrace", capacity: 3, mergeableGroupId: null,         displayOrder: 5 },
]

export const ALL_TABLES: TableDef[] = [
  ...BAR_TABLES,
  ...INDOOR_TABLES,
  ...TERRACE_TABLES,
]

const TABLE_INDEX = new Map(ALL_TABLES.map((t) => [t.id, t]))
export function getTable(id: string): TableDef | undefined {
  return TABLE_INDEX.get(id)
}
