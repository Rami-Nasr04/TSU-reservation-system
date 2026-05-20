import * as React from "react"
import { listTables, type Table } from "@/services/tablesService"

type State = {
  data: Table[] | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: Table[] }
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

interface UseTablesResult extends State {
  refetch: () => void
}

/** Table inventory fetch with `refetch()` for post-mutation reloads. */
export function useTables(): UseTablesResult {
  const [state, dispatch] = React.useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = React.useState(0)

  const refetch = React.useCallback(() => setReloadKey((k) => k + 1), [])

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    listTables()
      .then((rows) => {
        if (!cancelled) dispatch({ type: "success", payload: rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to load tables.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return { ...state, refetch }
}
