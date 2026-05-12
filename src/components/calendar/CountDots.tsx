interface CountDotsProps {
  count: number
  max: number
}

export function CountDots({ count, max }: CountDotsProps) {
  const ratio = max === 0 ? 0 : count / max
  const filled = ratio > 0.66 ? 3 : ratio > 0.33 ? 2 : ratio > 0 ? 1 : 0
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            i < filled ? "size-1 rounded-full bg-primary" : "size-1 rounded-full bg-hair-strong"
          }
        />
      ))}
    </span>
  )
}
