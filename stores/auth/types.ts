import type { User } from '~/types/api'

export type AppMode = 'online' | 'offline'

export interface AuthState {
  user: User | null
  token: string | null
  mode: AppMode | null
  deviceId: string | null
  isLoading: boolean
  error: string | null
  initialized: boolean
}

export interface PersistedAuthState {
  user?: User
  token?: string | null
  mode?: AppMode | null
  deviceId?: string | null
}

export interface AuthStoreContext extends AuthState {
  isAuthenticated: boolean
  loadFromStorage: () => void
  saveToStorage: () => void
  clearStorage: () => void
  refreshToken: () => Promise<boolean>
}
