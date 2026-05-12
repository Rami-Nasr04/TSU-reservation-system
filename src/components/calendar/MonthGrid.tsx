import { useNavigate } from "react-router-dom"
import {
  dayOfWeek,
  formatDateISO,
  mondayFirstLeadIn,
  todayParts,
} from "@/lib/dates"
import type { MonthFeed } from "@/services/reservationsService"
import { WeekHeader } from "./WeekHeader"
import { DayCell, type DayCellVariant } from "./DayCell"

interface MonthGridProps {
  feed: MonthFeed
  max: number
  variant: DayCellVariant
}

export function MonthGrid({ feed, max, variant }: MonthGridProps) {
  const navigate = useNavigate()
  const today = todayParts()
  const lead = mondayFirstLeadIn(feed.firstWeekday)

  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= feed.daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="overflow-hidden rounded-[3px] border border-hair bg-card">
      <WeekHeader compact={variant === "mobile"} />
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) {
            return (
              <DayCell
                key={`blank-${i}`}
                day={null}
                variant={variant}
                isPast={false}
                isToday={false}
                isWeekend={false}
                max={max}
              />
            )
          }
          const monthDay = feed.days[d - 1]
          const dow = dayOfWeek(feed.year, feed.month0, d)
          const isToday =
            today.year === feed.year &&
            today.month0 === feed.month0 &&
            today.day === d
          const isPast =
            feed.year < today.year ||
            (feed.year === today.year && feed.month0 < today.month0) ||
            (feed.year === today.year &&
              feed.month0 === today.month0 &&
              d < today.day)
          return (
            <DayCell
              key={d}
              day={monthDay}
              variant={variant}
              isPast={isPast}
              isToday={isToday}
              isWeekend={dow === 0 || dow === 6}
              max={max}
              onClick={() =>
                navigate(`/day/${formatDateISO(feed.year, feed.month0, d)}`)
              }
            />
          )
        })}
      </div>
    </div>
  )
}
