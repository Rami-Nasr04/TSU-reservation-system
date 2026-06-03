// Bridge between React-free apiClient and AuthContext. AuthProvider calls
// setAuthBridge(...) on mount; apiClient calls the getters.

type Bridge = {
  getIdToken: () => string | null
  tryRefresh: () => Promise<boolean>
  onAuthFailure: () => void
}

let bridge: Bridge = {
  getIdToken: () => null,
  tryRefresh: async () => false,
  onAuthFailure: () => {},
}

export function setAuthBridge(b: Bridge): void {
  bridge = b
}

export const getIdToken = (): string | null => bridge.getIdToken()
export const tryRefresh = (): Promise<boolean> => bridge.tryRefresh()
export const onAuthFailure = (): void => bridge.onAuthFailure()
