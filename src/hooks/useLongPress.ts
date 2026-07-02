import * as React from "react"

export const LONG_PRESS_MS = 500

interface UseLongPressOptions {
  enabled: boolean
  onLongPress: () => void
  ms?: number
}

/**
 * Press-and-hold gesture (pointer events, touch + mouse). Fires `onLongPress`
 * after `ms`; `progress` (0→1) drives an optional fill during the hold.
 * After a hold fires, `consumeClick()` returns true once so the caller can
 * swallow the trailing click and not also run its tap handler.
 */
export function useLongPress({ enabled, onLongPress, ms = LONG_PRESS_MS }: UseLongPressOptions) {
  const timerRef = React.useRef<number | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef(0)
  const firedRef = React.useRef(false)
  const [progress, setProgress] = React.useState(0)

  const clear = React.useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setProgress(0)
  }, [])

  const start = React.useCallback(() => {
    firedRef.current = false
    if (!enabled) return
    startRef.current = performance.now()
    const tick = () => {
      const elapsed = performance.now() - startRef.current
      setProgress(Math.min(1, elapsed / ms))
      if (elapsed < ms) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true
      clear()
      onLongPress()
    }, ms)
  }, [enabled, ms, onLongPress, clear])

  React.useEffect(() => clear, [clear])

  const consumeClick = React.useCallback(() => {
    if (firedRef.current) {
      firedRef.current = false
      return true
    }
    return false
  }, [])

  return {
    progress,
    consumeClick,
    handlers: {
      onPointerDown: start,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  }
}
