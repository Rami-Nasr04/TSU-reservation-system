import * as React from "react"
import { getKpi, rangeKey } from "@/services/analyticsService"
import type { AnalyticsRange, KpiSnapshot } from "@/services/analyticsService"

type State = {
  data: KpiSnapshot | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: KpiSnapshot }
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

interface UseAnalyticsKpiResult extends State {
  refetch: () => void
}

/** KPI snapshot for the dashboard cards. Refetches whenever the range changes. */
export function useAnalyticsKpi(range: AnalyticsRange): UseAnalyticsKpiResult {
  const [state, dispatch] = React.useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = React.useState(0)
  const key = rangeKey(range)

  // Depend on the stable `key` (objects break ===), but call the service with the
  // live range. Sync the ref in a layout effect — writing it in render is barred
  // by the react-hooks/refs rule.
  const rangeRef = React.useRef(range)
  React.useLayoutEffect(() => {
    rangeRef.current = range
  }, [range])

  const refetch = React.useCallback(() => setReloadKey((k) => k + 1), [])

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    getKpi(rangeRef.current)
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", payload: data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to load KPIs.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [key, reloadKey])

  return { ...state, refetch }
}
