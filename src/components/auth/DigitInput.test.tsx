import { describe, it, expect, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { DigitInput } from "./DigitInput"

describe("DigitInput", () => {
  it("auto-advances focus on digit input", () => {
    const onChange = vi.fn()
    render(<DigitInput value="" onChange={onChange} />)
    const boxes = screen.getAllByRole("textbox")
    fireEvent.change(boxes[0], { target: { value: "1" } })
    expect(onChange).toHaveBeenLastCalledWith("1")
    expect(document.activeElement).toBe(boxes[1])
  })

  it("backspace on empty box focuses previous and clears it", () => {
    const onChange = vi.fn()
    render(<DigitInput value="12" onChange={onChange} />)
    const boxes = screen.getAllByRole("textbox")
    ;(boxes[2] as HTMLInputElement).focus()
    fireEvent.keyDown(boxes[2], { key: "Backspace" })
    expect(onChange).toHaveBeenLastCalledWith("1")
    expect(document.activeElement).toBe(boxes[1])
  })

  it("paste fills all boxes and calls onComplete", () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(<DigitInput value="" onChange={onChange} onComplete={onComplete} />)
    const boxes = screen.getAllByRole("textbox")
    fireEvent.paste(boxes[0], {
      clipboardData: { getData: () => "abc123456xyz" },
    })
    expect(onChange).toHaveBeenLastCalledWith("123456")
    expect(onComplete).toHaveBeenCalledWith("123456")
  })

  it("ignores non-numeric input", () => {
    const onChange = vi.fn()
    render(<DigitInput value="" onChange={onChange} />)
    const boxes = screen.getAllByRole("textbox")
    fireEvent.change(boxes[0], { target: { value: "a" } })
    expect(onChange).not.toHaveBeenCalled()
  })
})
