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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CapacityStepper } from "./CapacityStepper"
import { createTable } from "@/services/tablesService"
import type { TableSection } from "@/lib/tables"

interface AddTableModalProps {
  open: boolean
  onClose: () => void
  defaultSection: TableSection
  /** display_order to assign (max in section + 1). */
  nextDisplayOrder: number
  /** Fired after a successful create so the parent can refetch. */
  onCreated: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

const SECTIONS: { value: TableSection; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "indoor", label: "Indoor" },
  { value: "terrace", label: "Terrace" },
]

export function AddTableModal({
  open,
  onClose,
  defaultSection,
  nextDisplayOrder,
  onCreated,
}: AddTableModalProps) {
  const [label, setLabel] = React.useState("")
  const [capacity, setCapacity] = React.useState(2)
  const [section, setSection] = React.useState<TableSection>(defaultSection)
  const [saving, setSaving] = React.useState(false)

  const canSave = label.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      await createTable({
        label: label.trim(),
        capacity,
        section,
        mergeable_group_id: null, // groups are read-only in v1
        display_order: nextDisplayOrder,
      })
      toast.success("Table added")
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add table.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add table</DialogTitle>
          <DialogDescription>
            New seats appear on the floor immediately. Merge groups stay read-only in v1.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="table-label" className={fieldLabel}>
              Label
            </Label>
            <Input
              id="table-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 52 or Bar 15"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Section</span>
            <Select
              value={section}
              onValueChange={(v) => setSection(v as TableSection)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className={fieldLabel}>Capacity</span>
            <CapacityStepper value={capacity} onChange={setCapacity} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Adding…" : "Add table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
