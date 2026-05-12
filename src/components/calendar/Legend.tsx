import { Overline } from "@/components/brand"

const STEPS = [0.03, 0.06, 0.09, 0.12, 0.15]

export function Legend() {
  return (
    <div className="inline-flex items-center gap-3.5">
      <Overline size="xs" tone="mute">
        Density
      </Overline>
      <div className="inline-flex items-center gap-1">
        {STEPS.map((alpha, i) => (
          <div
            key={i}
            className="h-2.5 w-[22px] border border-hair bg-primary"
            style={{ opacity: alpha / 0.15 }}
          />
        ))}
      </div>
      <div className="ml-1.5 inline-flex items-center gap-1.5">
        <div className="box-border size-2.5 border-[1.5px] border-primary" />
        <span className="text-[10.5px] tracking-[0.06em] text-brand-ink-soft">
          Today
        </span>
      </div>
    </div>
  )
}
