import * as React from "react"
import { getCustomerHistory } from "@/services/customersService"
import type { ReservationHistoryItem } from "@/services/customersService"

type State = {
  data: ReservationHistoryItem[] | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "reset" }
  | { type: "loading" }
  | { type: "success"; payload: ReservationHistoryItem[] }
  | { type: "error"; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { data: null, isLoading: false, error: null }
    case "loading":
      return { ...state, isLoading: true, error: null }
    case "success":
      return { data: action.payload, isLoading: false, error: null }
    case "error":
      return { data: null, isLoading: false, error: action.message }
  }
}

const initial: State = { data: null, isLoading: false, error: null }

/**
 * Drawer history fetch. Fetches when `id` is set; clears when `id` is null (no
 * customer selected). `limit` defaults to 6 per the design's history table.
 */
export function useCustomerHistory(
  id: string | null,
  limit = 6,
): State {
  const [state, dispatch] = React.useReducer(reducer, initial)

  React.useEffect(() => {
    if (!id) {
      dispatch({ type: "reset" })
      return
    }
    let cancelled = false
    dispatch({ type: "loading" })
    getCustomerHistory(id, limit)
      .then((rows) => {
        if (!cancelled) dispatch({ type: "success", payload: rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message:
              err instanceof Error ? err.message : "Failed to load history.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, limit])

  return state
}
