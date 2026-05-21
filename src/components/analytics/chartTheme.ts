import type { CSSProperties } from "react"

// recharts styles SVG/DOM via color-string props, so we pass brand tokens as
// `var(--…)` strings rather than Tailwind classes. Centralised here so all
// charts read identically.

export const GRID_STROKE = "var(--brand-hair)"

export const AXIS_TICK: { fontSize: number; fill: string } = {
  fontSize: 11,
  fill: "var(--brand-ink-soft)",
}

export const AXIS_TICK_MUTE: { fontSize: number; fill: string } = {
  fontSize: 11,
  fill: "var(--brand-ink-mute)",
}

export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--brand-hair-strong)",
  borderRadius: 3,
  fontSize: 12,
  color: "var(--popover-foreground)",
  padding: "8px 10px",
  boxShadow: "0 8px 24px -8px rgba(20,25,35,0.25)",
}

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--brand-ink-soft)",
  marginBottom: 4,
}

export const TOOLTIP_CURSOR = { fill: "var(--brand-hair)" }
