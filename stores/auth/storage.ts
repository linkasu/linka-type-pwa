import type { User } from '~/types/api'
import type { AppMode, AuthState, PersistedAuthState } from './types'

const AUTH_STORAGE_KEY = 'linka_auth'
const MODE_STORAGE_KEY = 'linka_mode'
const DEVICE_STORAGE_KEY = 'linka_device_id'

export const getOrCreateDeviceId = (): string => {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY)
  if (existing) return existing

  const deviceId = `device_${crypto.randomUUID()}`
  localStorage.setItem(DEVICE_STORAGE_KEY, deviceId)
  return deviceId
}

export const buildOfflineUser = (deviceId: string): User => ({
  id: deviceId,
  email: `${deviceId}@local.device`,
})

export const loadAuthFromStorage = (): PersistedAuthState => {
  const result: PersistedAuthState = {}
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as PersistedAuthState
      if (parsed.user) result.user = parsed.user
      if (typeof parsed.token === 'string') result.token = parsed.token
      if (parsed.mode) result.mode = parsed.mode
      if (parsed.deviceId) result.deviceId = parsed.deviceId
    } catch {
      // Ignore broken storage.
    }
  }

  if (!result.mode) {
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY)
    if (storedMode === 'online' || storedMode === 'offline') {
      result.mode = storedMode
    }
  }

  if (!result.deviceId) {
    result.deviceId = localStorage.getItem(DEVICE_STORAGE_KEY) || undefined
  }

  return result
}

export const applyStoredAuth = (
  store: Pick<AuthState, 'user' | 'token' | 'mode' | 'deviceId'>,
  snapshot: PersistedAuthState,
) => {
  if (snapshot.user) store.user = snapshot.user
  if (typeof snapshot.token === 'string') store.token = snapshot.token
  if (snapshot.mode) store.mode = snapshot.mode
  if (snapshot.deviceId) store.deviceId = snapshot.deviceId
}

export const saveAuthToStorage = (state: {
  user: User | null
  token: string | null
  mode: AppMode | null
  deviceId: string | null
}) => {
  const payload: PersistedAuthState = {
    user: state.user ?? undefined,
    token: state.token,
    mode: state.mode,
    deviceId: state.deviceId,
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))

  if (state.mode) {
    localStorage.setItem(MODE_STORAGE_KEY, state.mode)
  }

  if (state.deviceId) {
    localStorage.setItem(DEVICE_STORAGE_KEY, state.deviceId)
  }
}

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(MODE_STORAGE_KEY)
}
