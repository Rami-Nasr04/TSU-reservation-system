import * as React from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CapacityStepper } from "./CapacityStepper"
import { Toggle } from "./Toggle"
import { patchTable, type Table } from "@/services/tablesService"
import { cn } from "@/lib/utils"

interface EditTableModalProps {
  open: boolean
  onClose: () => void
  table: Table
  /** Full live table list — used to render same-section partner picker. */
  allTables: Table[]
  /** Fired after a successful PATCH so the parent can refetch. */
  onSaved: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

export function EditTableModal({
  open,
  onClose,
  table,
  allTables,
  onSaved,
}: EditTableModalProps) {
  const [capacity, setCapacity] = React.useState(table.capacity)
  const [active, setActive] = React.useState(table.active)
  const [mergeable, setMergeable] = React.useState(table.mergeableWith.length > 0)
  const [partners, setPartners] = React.useState<number[]>(table.mergeableWith)
  const [saving, setSaving] = React.useState(false)

  const partnerOptions = React.useMemo(
    () =>
      allTables
        .filter((t) => t.section === table.section && t.id !== table.id)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [allTables, table.section, table.id],
  )

  function togglePartner(id: number) {
    setPartners((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await patchTable(table.id, {
        capacity,
        active,
        mergeable_with: mergeable ? partners : [],
      })
      toast.success(`Table ${table.label} updated`)
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update table.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Table #{table.label}</DialogTitle>
          <DialogDescription>
            Capacity, active state, and merge partners. Section + label are
            fixed once a table exists.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <Label className={fieldLabel}>Capacity</Label>
            <CapacityStepper value={capacity} onChange={setCapacity} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className={fieldLabel}>Active</span>
              <span className="text-[10.5px] text-brand-ink-mute">
                Inactive tables hide from the floor and pickers
              </span>
            </div>
            <Toggle on={active} onChange={setActive} ariaLabel="Active" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className={fieldLabel}>Mergeable</span>
              <span className="text-[10.5px] text-brand-ink-mute">
                Allow combining with selected siblings
              </span>
            </div>
            <Toggle
              on={mergeable}
              onChange={setMergeable}
              ariaLabel="Mergeable"
            />
          </div>

          {mergeable && (
            <div className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Merge with</span>
              {partnerOptions.length === 0 ? (
                <div className="rounded-[3px] border border-dashed border-hair-strong bg-background px-3 py-3 text-center text-[11px] text-brand-ink-mute">
                  No other tables in this section.
                </div>
              ) : (
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-[3px] border border-hair bg-background p-1.5">
                  {partnerOptions.map((t) => {
                    const isOn = partners.includes(t.id)
                    return (
                      <label
                        key={t.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-[2px] px-2 py-1.5 text-[12.5px] transition-colors",
                          isOn ? "bg-primary/[0.06]" : "hover:bg-foreground/[0.04]",
                          !t.active && "opacity-55",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={isOn}
                          onChange={() => togglePartner(t.id)}
                        />
                        <span className="flex-1 font-light tracking-[0.02em]">
                          Table #{t.label}
                        </span>
                        <span className="text-[11px] tracking-[0.04em] text-brand-ink-soft">
                          seats {t.capacity}
                          {!t.active && " · off"}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
