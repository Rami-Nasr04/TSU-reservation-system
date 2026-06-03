const KEYS = {
  refreshToken: "tsu:auth:refreshToken",
  deviceKey: "tsu:auth:deviceKey",
  deviceGroupKey: "tsu:auth:deviceGroupKey",
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
  save(t: {
    refreshToken?: string
    deviceKey?: string
    deviceGroupKey?: string
  }): void {
    if (t.refreshToken !== undefined) safeSet(KEYS.refreshToken, t.refreshToken)
    if (t.deviceKey !== undefined) safeSet(KEYS.deviceKey, t.deviceKey)
    if (t.deviceGroupKey !== undefined) safeSet(KEYS.deviceGroupKey, t.deviceGroupKey)
  },
  clear(): void {
    safeRemove(KEYS.refreshToken)
    safeRemove(KEYS.deviceKey)
    safeRemove(KEYS.deviceGroupKey)
  },
}
