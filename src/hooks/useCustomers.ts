import * as React from "react"
import { listCustomers } from "@/services/customersService"
import type {
  CustomerFilters,
  CustomerWithStats,
} from "@/services/customersService"

type State = {
  data: CustomerWithStats[] | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: CustomerWithStats[] }
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

interface UseCustomersResult extends State {
  refetch: () => void
}

/**
 * CRM list fetch. Refetches whenever any filter value changes (deps are the
 * primitives, not the object reference, so an inline filter object is safe) or
 * `refetch()` is called after a mutation.
 */
export function useCustomers(filters: CustomerFilters): UseCustomersResult {
  const [state, dispatch] = React.useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = React.useState(0)
  const { search, vip, segment, sort, limit, offset } = filters

  const refetch = React.useCallback(() => setReloadKey((k) => k + 1), [])

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    listCustomers({ search, vip, segment, sort, limit, offset })
      .then((rows) => {
        if (!cancelled) dispatch({ type: "success", payload: rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message:
              err instanceof Error ? err.message : "Failed to load customers.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [search, vip, segment, sort, limit, offset, reloadKey])

  return { ...state, refetch }
}
