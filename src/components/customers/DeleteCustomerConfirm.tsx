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
import { Button } from "@/components/ui/button"
import { deleteCustomer } from "@/services/customersService"
import { displayName } from "./format"
import type { CustomerWithStats } from "@/services/customersService"

interface DeleteCustomerConfirmProps {
  open: boolean
  onClose: () => void
  customer: CustomerWithStats
  /** Fired after a successful hard-delete. */
  onDeleted: () => void
}

export function DeleteCustomerConfirm({
  open,
  onClose,
  customer,
  onDeleted,
}: DeleteCustomerConfirmProps) {
  const [deleting, setDeleting] = React.useState(false)

  async function handleConfirm() {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteCustomer(customer.id)
      toast.success("Customer deleted")
      onDeleted()
      onClose()
    } catch (err) {
      // 409 (FK conflict) surfaces the reassign/cancel-first message from the service.
      toast.error(err instanceof Error ? err.message : "Couldn't delete customer.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete customer?</DialogTitle>
          <DialogDescription>
            <span className="text-foreground">{displayName(customer)}</span> will
            be permanently removed. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
