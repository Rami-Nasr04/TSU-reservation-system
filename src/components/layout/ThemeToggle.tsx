import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[3px] text-foreground transition-colors duration-150",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-3.5 sm:size-4" />
      ) : (
        <Moon className="size-3.5 sm:size-4" />
      )}
    </button>
  )
}
