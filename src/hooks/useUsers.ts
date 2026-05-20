import * as React from "react"
import { listUsers, type StaffUser, type UserFilters } from "@/services/usersService"

type State = {
  data: StaffUser[] | null
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "loading" }
  | { type: "success"; payload: StaffUser[] }
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

interface UseUsersResult extends State {
  refetch: () => void
}

/**
 * Staff list fetch. Returns `[]` from the backend until Cognito seeds the users
 * table (P10b); the Staff panel layers a static client-side mock on top for
 * visual completeness during dev.
 */
export function useUsers(filters: UserFilters = {}): UseUsersResult {
  const [state, dispatch] = React.useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = React.useState(0)
  const { role, search } = filters

  const refetch = React.useCallback(() => setReloadKey((k) => k + 1), [])

  React.useEffect(() => {
    let cancelled = false
    dispatch({ type: "loading" })
    listUsers({ role, search })
      .then((rows) => {
        if (!cancelled) dispatch({ type: "success", payload: rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to load staff.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [role, search, reloadKey])

  return { ...state, refetch }
}
