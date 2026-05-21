import * as React from "react"
import {
  getRecentWalkIns,
  getRushHour,
  getTablePerformance,
  getWeekly,
  rangeKey,
} from "@/services/analyticsService"
import type {
  AnalyticsRange,
  RecentWalkIn,
  RushHourBucket,
  TablePerf,
  WeeklyBucket,
} from "@/services/analyticsService"

export interface AnalyticsCharts {
  rushHour: RushHourBucket[]
  weekly: WeeklyBucket[]
  tablePerf: TablePerf[]
  walkIns: RecentWalkIn[]
}

type State = {
  data: AnalyticsCharts | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: AnalyticsCharts }
  | { type: "error"; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: null }
    case "success":
      return { data: action.payload, isLoading: false, error: null }
    case "error":
      return { data: null, isLoading: false, error: action.message }
  }
}

const initial: State = { data: null, isLoading: true, error: null }

interface UseAnalyticsChartsResult extends State {
  refetch: () => void
}

const WALK_INS_LIMIT = 10

/**
 * The four chart/table feeds behind the dashboard. A single range change fires
 * all four fetches in parallel (`Promise.all`); they resolve into one state so
 * the charts section shares one loading/error. KPIs are fetched separately
 * (`useAnalyticsKpi`) so a KPI failure doesn't blank the charts and vice-versa.
 */
export function useAnalyticsCharts(
  range: AnalyticsRange,
): UseAnalyticsChartsResult {
  const [state, dispatch] = React.useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = React.useState(0)
  const key = rangeKey(range)

  const rangeRef = React.useRef(range)
  React.useLayoutEffect(() => {
    rangeRef.current = range
  }, [range])

  const refetch = React.useCallback(() => setReloadKey((k) => k + 1), [])

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    const r = rangeRef.current
    Promise.all([
      getRushHour(r),
      getWeekly(r),
      getTablePerformance(r),
      getRecentWalkIns(WALK_INS_LIMIT),
    ])
      .then(([rushHour, weekly, tablePerf, walkIns]) => {
        if (!cancelled) {
          dispatch({
            type: "success",
            payload: { rushHour, weekly, tablePerf, walkIns },
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message:
              err instanceof Error ? err.message : "Failed to load analytics.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [key, reloadKey])

  return { ...state, refetch }
}
