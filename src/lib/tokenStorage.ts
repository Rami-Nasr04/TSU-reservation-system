const KEYS = {
  refreshToken: "tsu:auth:refreshToken",
  deviceKey: "tsu:auth:deviceKey",
  deviceGroupKey: "tsu:auth:deviceGroupKey",
  devicePassword: "tsu:auth:devicePassword",
} as const

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode / quota — swallow */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}

export const tokenStorage = {
  get refreshToken(): string | null {
    return safeGet(KEYS.refreshToken)
  },
  get deviceKey(): string | null {
    return safeGet(KEYS.deviceKey)
  },
  get deviceGroupKey(): string | null {
    return safeGet(KEYS.deviceGroupKey)
  },
  get devicePassword(): string | null {
    return safeGet(KEYS.devicePassword)
  },
  save(t: {
    refreshToken?: string
    deviceKey?: string
    deviceGroupKey?: string
    devicePassword?: string
  }): void {
    if (t.refreshToken !== undefined) safeSet(KEYS.refreshToken, t.refreshToken)
    if (t.deviceKey !== undefined) safeSet(KEYS.deviceKey, t.deviceKey)
    if (t.deviceGroupKey !== undefined)
      safeSet(KEYS.deviceGroupKey, t.deviceGroupKey)
    if (t.devicePassword !== undefined)
      safeSet(KEYS.devicePassword, t.devicePassword)
  },
  // Wipe only the session token; keep device keys so the next sign-in on this
  // browser still presents as a remembered device and skips MFA. Used by
  // signOut and boot-rehydration failures.
  clearSession(): void {
    safeRemove(KEYS.refreshToken)
  },
  // Full wipe including device state. Used when auth is fundamentally broken
  // (e.g., mid-session 401 with refresh rejected — user was deleted or pool
  // rotated).
  clear(): void {
    safeRemove(KEYS.refreshToken)
    safeRemove(KEYS.deviceKey)
    safeRemove(KEYS.deviceGroupKey)
    safeRemove(KEYS.devicePassword)
  },
}
