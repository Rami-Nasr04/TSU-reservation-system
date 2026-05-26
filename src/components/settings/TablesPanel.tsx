import * as React from "react"
import { ChevronDown, ChevronRight, Link2, MoreVertical, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { patchTable, deleteTable, type Table } from "@/services/tablesService"
import type { TableSection } from "@/lib/tables"
import { Toggle } from "./Toggle"
import { CapacityStepper } from "./CapacityStepper"
import { AddTableModal } from "./AddTableModal"
import { EditTableModal } from "./EditTableModal"

interface TablesPanelProps {
  tables: Table[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const SECTIONS: { id: TableSection; label: string; note: string }[] = [
  { id: "bar", label: "Bar", note: "chef's counter seats" },
  { id: "indoor", label: "Indoor", note: "main dining room" },
  { id: "terrace", label: "Terrace", note: "outdoor" },
]

export function TablesPanel({ tables, isLoading, error, refetch }: TablesPanelProps) {
  const [open, setOpen] = React.useState<Record<TableSection, boolean>>({
    bar: false,
    indoor: true,
    terrace: false,
  })

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-[11.5px] text-brand-ink-soft">{error}</span>
        <button
          type="button"
          onClick={refetch}
          className="rounded-full border border-hair-strong px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft hover:text-foreground"
        >
          Try again
        </button>
      </div>
    )
  }
  if (isLoading && tables.length === 0) {
    return (
      <div className="py-16 text-center text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
        Loading tables…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {SECTIONS.map((s) => {
        const rows = tables
          .filter((t) => t.section === s.id)
          .sort((a, b) => a.displayOrder - b.displayOrder)
        return (
          <SectionPanel
            key={s.id}
            section={s.id}
            label={s.label}
            note={`${rows.length} ${rows.length === 1 ? "seat" : "seats"} · ${s.note}`}
            rows={rows}
            allTables={tables}
            isOpen={open[s.id]}
            onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
            onChanged={refetch}
          />
        )
      })}
    </div>
  )
}

interface SectionPanelProps {
  section: TableSection
  label: string
  note: string
  rows: Table[]
  allTables: Table[]
  isOpen: boolean
  onToggle: () => void
  onChanged: () => void
}

function SectionPanel({
  section,
  label,
  note,
  rows,
  allTables,
  isOpen,
  onToggle,
  onChanged,
}: SectionPanelProps) {
  const [adding, setAdding] = React.useState(false)
  const activeCount = rows.filter((r) => r.active).length
  const nextOrder = rows.reduce((max, r) => Math.max(max, r.displayOrder), 0) + 1

  return (
    <div className="overflow-hidden rounded-[3px] border border-hair bg-background">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-[18px] py-3.5 text-left",
          isOpen && "bg-foreground/[0.02]",
        )}
      >
        <span className="text-brand-ink-soft">
          {isOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </span>
        <span className="text-[14px] font-medium tracking-[0.04em] text-foreground">
          {label}
        </span>
        <span className="text-[11.5px] tracking-[0.02em] text-brand-ink-soft">
          {note}
        </span>
        <span className="ml-auto text-[10.5px] uppercase tracking-[0.16em] text-brand-ink-mute">
          {activeCount}/{rows.length} active
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-hair">
          {rows.map((t) => (
            <TableRow
              key={t.id}
              table={t}
              allTables={allTables}
              onChanged={onChanged}
            />
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "flex w-full items-center gap-1.5 border-t border-hair px-[18px] py-3 text-left",
              "text-[11px] font-medium uppercase tracking-[0.16em] text-brand-ink-soft",
              "transition-colors duration-150 hover:text-foreground",
            )}
          >
            <Plus className="size-3" /> Add table
          </button>
        </div>
      )}

      {adding && (
        <AddTableModal
          open
          defaultSection={section}
          nextDisplayOrder={nextOrder}
          allTables={allTables}
          onClose={() => setAdding(false)}
          onCreated={onChanged}
        />
      )}
    </div>
  )
}

interface TableRowProps {
  table: Table
  allTables: Table[]
  onChanged: () => void
}

function TableRow({ table, allTables, onChanged }: TableRowProps) {
  const [capacity, setCapacity] = React.useState(table.capacity)
  const [active, setActive] = React.useState(table.active)
  const [busy, setBusy] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const capTimer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    return () => window.clearTimeout(capTimer.current)
  }, [])

  function changeCapacity(next: number) {
    setCapacity(next)
    window.clearTimeout(capTimer.current)
    capTimer.current = window.setTimeout(() => {
      patchTable(table.id, { capacity: next })
        .then(onChanged)
        .catch((err: unknown) => {
          setCapacity(table.capacity)
          toast.error(err instanceof Error ? err.message : "Couldn't save capacity.")
        })
    }, 500)
  }

  async function toggleActive() {
    const next = !active
    setActive(next)
    setBusy(true)
    try {
      await patchTable(table.id, { active: next })
      onChanged()
    } catch (err) {
      setActive(!next)
      toast.error(err instanceof Error ? err.message : "Couldn't update table.")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteTable(table.id)
      toast.success(`Table ${table.label} deleted`)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete table.")
    }
  }

  const partnerCount = table.mergeableWith.length

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-hair px-[18px] py-3 first:border-t-0",
        !active && "opacity-55",
      )}
    >
      <span className="w-16 shrink-0 text-[13px] tracking-[0.02em] text-foreground">
        {table.label}
      </span>
      <span className="min-w-0 flex-1 text-[11px] tracking-[0.04em] text-brand-ink-soft">
        {partnerCount > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="size-3 text-brand-ink-mute" />
            Mergeable · {partnerCount} {partnerCount === 1 ? "partner" : "partners"}
          </span>
        ) : (
          <span className="text-brand-ink-mute">—</span>
        )}
      </span>
      <CapacityStepper value={capacity} onChange={changeCapacity} compact />
      <Toggle
        on={active}
        onChange={toggleActive}
        disabled={busy}
        ariaLabel={`Table ${table.label} active`}
      />
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit table ${table.label}`}
        className="inline-flex size-7 items-center justify-center rounded-[3px] text-brand-ink-soft outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Pencil className="size-3.5" strokeWidth={1.5} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex size-7 items-center justify-center rounded-[3px] text-brand-ink-soft outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`Table ${table.label} menu`}
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editing && (
        <EditTableModal
          open
          table={table}
          allTables={allTables}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
        />
      )}
    </div>
  )
}
