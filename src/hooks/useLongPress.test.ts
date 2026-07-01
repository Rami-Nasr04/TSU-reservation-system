import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useLongPress } from "./useLongPress"

beforeEach(() => {
  vi.useFakeTimers()
  // rAF only drives the visual fill; make it a no-op so timers drive the test.
  vi.stubGlobal("requestAnimationFrame", () => 0)
  vi.stubGlobal("cancelAnimationFrame", () => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it("fires onLongPress after 500ms of holding", () => {
  const onLongPress = vi.fn()
  const { result } = renderHook(() => useLongPress({ enabled: true, onLongPress }))
  act(() => result.current.handlers.onPointerDown())
  act(() => vi.advanceTimersByTime(500))
  expect(onLongPress).toHaveBeenCalledTimes(1)
})

it("does not fire if released before 500ms", () => {
  const onLongPress = vi.fn()
  const { result } = renderHook(() => useLongPress({ enabled: true, onLongPress }))
  act(() => result.current.handlers.onPointerDown())
  act(() => vi.advanceTimersByTime(300))
  act(() => result.current.handlers.onPointerUp())
  act(() => vi.advanceTimersByTime(500))
  expect(onLongPress).not.toHaveBeenCalled()
})

it("does not fire when disabled", () => {
  const onLongPress = vi.fn()
  const { result } = renderHook(() => useLongPress({ enabled: false, onLongPress }))
  act(() => result.current.handlers.onPointerDown())
  act(() => vi.advanceTimersByTime(500))
  expect(onLongPress).not.toHaveBeenCalled()
})

it("consumeClick returns true once after a fired hold, then false", () => {
  const { result } = renderHook(() => useLongPress({ enabled: true, onLongPress: () => {} }))
  act(() => result.current.handlers.onPointerDown())
  act(() => vi.advanceTimersByTime(500))
  expect(result.current.consumeClick()).toBe(true)
  expect(result.current.consumeClick()).toBe(false)
})
