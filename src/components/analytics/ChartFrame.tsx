import * as React from "react"

interface ChartFrameProps {
  /** Fixed-height classes — the frame reserves the space so there's no layout shift. */
  className?: string
  /**
   * Render the chart with measured pixel dimensions. We measure the box ourselves
   * and pass explicit width/height instead of using recharts' ResponsiveContainer,
   * which logs a transient `width(-1)/height(-1)` warning on its first render
   * before its own observer fires. The chart only renders once we have real
   * dimensions, so that warning never happens (dev or prod).
   */
  children: (dims: { width: number; height: number }) => React.ReactElement
}

export function ChartFrame({ className, children }: ChartFrameProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [dims, setDims] = React.useState<{ width: number; height: number } | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) setDims({ width: Math.round(box.width), height: Math.round(box.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {dims && dims.width > 0 && dims.height > 0 && children(dims)}
    </div>
  )
}
