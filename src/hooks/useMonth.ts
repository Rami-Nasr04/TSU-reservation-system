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

type State = {
  data: MonthFeed | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: MonthFeed }
  | { type: "error"; message: string }

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { data: null, isLoading: true, error: null }
    case "success":
      return { data: action.payload, isLoading: false, error: null }
    case "error":
      return { data: null, isLoading: false, error: action.message }
  }
}

const initial: State = { data: null, isLoading: true, error: null }

export function useMonth(year: number, month0: number): UseMonthResult {
  const [state, dispatch] = React.useReducer(reducer, initial)

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    getMonth(year, month0)
      .then((feed) => {
        if (!cancelled) dispatch({ type: "success", payload: feed })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to load month.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [year, month0])

  const max = React.useMemo(() => {
    if (!state.data) return 0
    return state.data.days.reduce((m, d) => Math.max(m, d.count), 0)
  }, [state.data])

  return { data: state.data, isLoading: state.isLoading, error: state.error, max }
}
