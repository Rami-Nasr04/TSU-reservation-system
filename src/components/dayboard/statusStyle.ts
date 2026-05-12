import type { ReservationStatus } from "@/services/reservationsService"

/** Per-status visual config. */
export const STATUS_STYLE: Record<
  ReservationStatus,
  { label: string; textClass: string; bgClass: string; dotClass: string; barClass: string }
> = {
  booked:    { label: "Booked",    textClass: "text-amber-700 dark:text-amber-300", bgClass: "bg-amber-700/10",  dotClass: "bg-amber-700 dark:bg-amber-300", barClass: "bg-amber-700 dark:bg-amber-300" },
  seated:    { label: "Seated",    textClass: "text-primary",                        bgClass: "bg-primary/10",    dotClass: "bg-primary",                      barClass: "bg-primary" },
  completed: { label: "Completed", textClass: "text-brand-ink-soft",                 bgClass: "bg-foreground/5",  dotClass: "bg-brand-ink-soft",               barClass: "bg-brand-ink-soft" },
  cancelled: { label: "Cancelled", textClass: "text-brand-ink-mute",                 bgClass: "bg-foreground/5",  dotClass: "bg-brand-ink-mute",               barClass: "bg-brand-ink-mute" },
  noshow:    { label: "No-show",   textClass: "text-brand-ink-soft",                 bgClass: "bg-foreground/5",  dotClass: "bg-brand-ink-soft",               barClass: "bg-brand-ink-soft" },
}
