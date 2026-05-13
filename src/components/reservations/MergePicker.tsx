import * as React from "react"

import { cn } from "@/lib/utils"
import { getMergeableSiblings, getTable } from "@/lib/tables"
import { Checkbox } from "@/components/ui/checkbox"

interface MergePickerProps {
  primaryTableId: string
  selectedTables: string[]
  onChange: (tables: string[]) => void
}

export function MergePicker({
  primaryTableId,
  selectedTables,
  onChange,
}: MergePickerProps) {
  const siblings = React.useMemo(
    () => getMergeableSiblings(primaryTableId),
    [primaryTableId],
  )

  if (siblings.length === 0) return null

  function toggle(siblingId: string, checked: boolean) {
    const base = selectedTables.includes(primaryTableId)
      ? selectedTables
      : [primaryTableId, ...selectedTables]

    if (checked) {
      if (base.includes(siblingId)) {
        onChange(base)
        return
      }
      onChange([...base, siblingId])
      return
    }

    onChange(base.filter((t) => t !== siblingId))
  }

  return (
    <div className="border-t border-hair pt-4 mt-4">
      <span className="text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute">
        Merge with
      </span>
      <div className="mt-2 flex flex-col">
        {siblings.map((sid) => {
          const def = getTable(sid)
          const capacity = def?.capacity ?? 0
          const checked = selectedTables.includes(sid)
          const inputId = `merge-${sid}`
          return (
            <label
              key={sid}
              htmlFor={inputId}
              className={cn(
                "flex items-center gap-2.5 py-3",
                "cursor-pointer select-none",
                "text-[12.5px] font-light text-foreground",
              )}
            >
              <Checkbox
                id={inputId}
                checked={checked}
                onCheckedChange={(v) => toggle(sid, Boolean(v))}
              />
              <span>
                Table {sid}{" "}
                <span className="text-brand-ink-mute">· seats {capacity}</span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
