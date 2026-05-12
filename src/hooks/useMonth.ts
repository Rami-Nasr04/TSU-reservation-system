import * as React from "react"
import {
  getMonth,
  type MonthFeed,
} from "@/services/reservationsService"

interface UseMonthResult {
  data: MonthFeed | null
  isLoading: boolean
  error: string | null
  /** Largest `count` in this month — used to scale heatmap intensity. */
  max: number
}

export function useMonth(year: number, month0: number): UseMonthResult {
  const [data, setData] = React.useState<MonthFeed | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getMonth(year, month0)
      .then((feed) => {
        if (!cancelled) setData(feed)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load month.")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year, month0])

  const max = React.useMemo(() => {
    if (!data) return 0
    return data.days.reduce((m, d) => Math.max(m, d.count), 0)
  }, [data])

  return { data, isLoading, error, max }
}
