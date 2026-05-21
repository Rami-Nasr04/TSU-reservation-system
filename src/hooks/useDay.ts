import * as React from "react"
import { getDay } from "@/services/reservationsService"
import type { DayFeed } from "@/services/reservationsService"

type State = {
  data: DayFeed | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: DayFeed }
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

interface UseDayResult {
  data: DayFeed | null
  isLoading: boolean
  error: string | null
}

export function useDay(date: string, reloadKey?: number): UseDayResult {
  const [state, dispatch] = React.useReducer(reducer, initial)

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    getDay(date)
      .then((feed) => {
        if (!cancelled) dispatch({ type: "success", payload: feed })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to load day.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [date, reloadKey])

  return { data: state.data, isLoading: state.isLoading, error: state.error }
}
