import * as React from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  patchCustomer,
  upsertCustomer,
  type CustomerWithStats,
} from "@/services/customersService"
import { PhoneField } from "@/components/ui/PhoneField"

interface AddCustomerDialogProps {
  open: boolean
  onClose: () => void
  /** Present = edit an existing customer; absent = create a new one. */
  customer?: CustomerWithStats
  /** Fired after a successful save so the parent can refetch the list. */
  onSaved: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

export function AddCustomerDialog({
  open,
  onClose,
  customer,
  onSaved,
}: AddCustomerDialogProps) {
  const isEdit = Boolean(customer)
  const [name, setName] = React.useState(customer?.name ?? "")
  const [phone, setPhone] = React.useState(customer?.phone ?? "")
  const [email, setEmail] = React.useState(customer?.email ?? "")
  const [vip, setVip] = React.useState(customer?.vip ?? false)
  const [saving, setSaving] = React.useState(false)

  const canSave = name.trim().length > 0 || phone.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      if (customer) {
        await patchCustomer(customer.id, {
          name,
          phone,
          email,
          vip,
        })
      } else {
        await upsertCustomer({ name, phone, email, vip })
      }
      toast.success(isEdit ? "Customer updated" : "Customer added")
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save customer.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this guest's contact details."
              : "Add a guest to the directory. Phone must be in international format."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-name" className={fieldLabel}>
              Name
            </Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-phone" className={fieldLabel}>
                Phone
              </Label>
              <PhoneField value={phone} onChange={setPhone} disabled={saving} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-email" className={fieldLabel}>
                Email
              </Label>
              <Input
                id="cust-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                inputMode="email"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVip((v) => !v)}
            aria-pressed={vip}
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5",
              "text-[10.5px] font-medium uppercase tracking-[0.18em] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              vip
                ? "border-brand-gold/40 bg-brand-gold-soft text-brand-gold-deep"
                : "border-hair-strong text-brand-ink-soft hover:text-foreground",
            )}
          >
            <Star className={cn("size-3", vip && "fill-current")} />
            {vip ? "VIP guest" : "Mark as VIP"}
          </button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
