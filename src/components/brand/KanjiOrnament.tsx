import { cn } from "@/lib/utils"

export type KanjiChar = "津" | "波"
export type KanjiSize = "sm" | "md" | "lg"

interface KanjiOrnamentProps {
  char: KanjiChar
  size?: KanjiSize
  className?: string
}

const sizeText: Record<KanjiSize, string> = {
  sm: "text-[10px]",
  md: "text-[14px]",
  lg: "text-[18px]",
}

export function KanjiOrnament({
  char,
  size = "md",
  className,
}: KanjiOrnamentProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block font-light leading-none text-brand-ink-mute",
        "[font-family:'Hiragino_Mincho_ProN','Yu_Mincho','Noto_Serif_JP',serif]",
        sizeText[size],
        className,
      )}
    >
      {char}
    </span>
  )
}
