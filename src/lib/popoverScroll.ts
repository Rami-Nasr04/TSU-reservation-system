import * as React from "react"

/**
 * Callback ref for a scrollable element rendered inside a Radix Dialog.
 *
 * The Dialog's scroll-lock (react-remove-scroll) cancels native wheel/touch
 * scrolling on portaled Popover content — the scrollbar still works, but the
 * mousewheel and finger-drag don't. We re-apply the scroll manually so both
 * work again. Returns a React 19 ref-cleanup that detaches the listeners.
 */
export function usePopoverScrollFix() {
  return React.useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    let lastY = 0
    const onWheel = (e: WheelEvent) => {
      el.scrollTop += e.deltaY
    }
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? lastY
      el.scrollTop += lastY - y
      lastY = y
    }
    el.addEventListener("wheel", onWheel, { passive: true })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [])
}
