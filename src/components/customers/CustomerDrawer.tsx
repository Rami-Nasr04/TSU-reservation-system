import * as React from "react"
import { Mail, Phone, Plus, Star, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { formatPhone } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCustomerHistory } from "@/hooks/useCustomerHistory"
import { patchCustomer, type CustomerWithStats } from "@/services/customersService"
import { CustomerAvatar } from "./CustomerAvatar"
import { HistoryTable } from "./HistoryTable"
import { TagChip } from "./TagChip"
import { displayName, formatDayLabel, formatMoney, loyaltyTier } from "./format"

interface CustomerDrawerProps {
  customer: CustomerWithStats
  isMobile?: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onBookAgain: () => void
  /** Fired after an inline tag/notes patch so the list can refetch. */
  onPatched: () => void
}

const sectionLabel =
  "text-[10px] font-medium uppercase tracking-[0.28em] text-brand-ink-soft"

export function CustomerDrawer({
  customer: c,
  isMobile,
  onClose,
  onEdit,
  onDelete,
  onBookAgain,
  onPatched,
}: CustomerDrawerProps) {
  const history = useCustomerHistory(c.id)

  const [tags, setTags] = React.useState<string[]>(c.tags)
  const [addingTag, setAddingTag] = React.useState(false)
  const [tagDraft, setTagDraft] = React.useState("")

  const [notes, setNotes] = React.useState(c.notes ?? "")
  const [savingNote, setSavingNote] = React.useState(false)
  const notesDirty = notes.trim() !== (c.notes ?? "").trim()

  async function persistTags(next: string[]) {
    const prev = tags
    setTags(next)
    try {
      await patchCustomer(c.id, { tags: next })
      onPatched()
    } catch (err) {
      setTags(prev)
      toast.error(err instanceof Error ? err.message : "Couldn't update tags.")
    }
  }

  function addTag() {
    const t = tagDraft.trim()
    setAddingTag(false)
    setTagDraft("")
    if (!t || tags.includes(t)) return
    void persistTags([...tags, t])
  }

  async function saveNotes() {
    if (!notesDirty || savingNote) return
    setSavingNote(true)
    try {
      await patchCustomer(c.id, { notes })
      toast.success("Note saved")
      onPatched()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save note.")
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="border-b border-hair p-6 pb-4">
        <div className="flex items-start gap-3.5">
          <CustomerAvatar name={c.name} vip={c.vip} size={52} />
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-light tracking-[0.02em] text-foreground">
              {displayName(c)}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-brand-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3 text-brand-ink-mute" />
                {c.phone ? formatPhone(c.phone) : "No phone"}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="size-3 shrink-0 text-brand-ink-mute" />
                <span className="truncate">{c.email ?? "No email"}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-[3px] text-brand-ink-soft",
              "transition-colors duration-150 hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tags + VIP */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {c.vip && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-brand-gold-deep">
              <Star className="size-2.5 fill-current" /> VIP
            </span>
          )}
          {tags.map((t) => (
            <TagChip
              key={t}
              label={t}
              onRemove={() => void persistTags(tags.filter((x) => x !== t))}
            />
          ))}
          {addingTag ? (
            <input
              autoFocus
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onBlur={addTag}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag()
                if (e.key === "Escape") {
                  setAddingTag(false)
                  setTagDraft("")
                }
              }}
              placeholder="Tag…"
              className={cn(
                "h-[26px] w-24 rounded-full border border-hair-strong bg-card px-2.5",
                "text-[10.5px] tracking-[0.04em] text-foreground placeholder:text-brand-ink-mute",
                "focus-visible:border-foreground focus-visible:outline-none",
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingTag(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-dashed border-hair-strong px-2.5 py-1",
                "text-[10.5px] tracking-[0.04em] text-brand-ink-mute",
                "transition-colors duration-150 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <Plus className="size-2.5" /> Tag
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 px-6 pt-5">
          <Stat label="Visits" value={String(c.visitCount)} />
          <Stat label="Lifetime" value={formatMoney(c.lifetimeSpend)} divider />
          <Stat
            label="Avg party"
            value={c.avgPax != null ? c.avgPax.toFixed(1) : "—"}
            divider
          />
          <Stat label="Avg tip" value={formatMoney(c.avgTip)} />
          <Stat label="Last visit" value={formatDayLabel(c.lastVisit)} divider />
          <Stat label="Loyalty" value={loyaltyTier(c.visitCount)} divider />
        </div>

        {/* History */}
        <div className="px-6 pt-6">
          <div className={cn(sectionLabel, "mb-2.5")}>Reservation history</div>
          <HistoryTable
            items={history.data}
            isLoading={history.isLoading}
            error={history.error}
          />
        </div>

        {/* Notes */}
        <div className="px-6 py-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className={sectionLabel}>Pinned notes</span>
            {notesDirty && (
              <button
                type="button"
                onClick={saveNotes}
                disabled={savingNote}
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.18em] text-primary",
                  "transition-opacity hover:opacity-80 disabled:opacity-50",
                )}
              >
                {savingNote ? "Saving…" : "Save note"}
              </button>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergies, seating preferences, occasions…"
            className="min-h-20 rounded-[3px] border-hair bg-brand-paper-warm text-[12.5px] leading-relaxed"
          />
        </div>
      </div>

      {/* Footer CTAs */}
      <div
        className={cn(
          "mt-auto flex gap-2 border-t border-hair bg-background p-4 sm:px-6",
          isMobile && "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <Button className="flex-1" onClick={onBookAgain}>
          Book again
        </Button>
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  divider,
}: {
  label: string
  value: string
  divider?: boolean
}) {
  return (
    <div className={cn("px-3.5 py-2.5", divider && "border-l border-hair")}>
      <div className="mb-1.5 text-[9.5px] font-medium uppercase tracking-[0.22em] text-brand-ink-mute">
        {label}
      </div>
      <div className="text-[16px] font-light tabular-nums tracking-[0.02em] text-foreground">
        {value}
      </div>
    </div>
  )
}
