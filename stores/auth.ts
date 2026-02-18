import { defineStore } from 'pinia'
import type { User } from '~/types/api'
import { clearUserData } from '~/utils/offlineDb'
import { useAnalytics } from '~/composables/useAnalytics'

const AUTH_STORAGE_KEY = 'linka_auth'
const MODE_STORAGE_KEY = 'linka_mode'
const DEVICE_STORAGE_KEY = 'linka_device_id'

type AppMode = 'online' | 'offline'

let initializePromise: Promise<boolean> | null = null

interface AuthState {
  user: User | null
  token: string | null
  mode: AppMode | null
  deviceId: string | null
  isLoading: boolean
  error: string | null
  initialized: boolean
}

const getOrCreateDeviceId = (): string => {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY)
  if (existing) return existing
  const deviceId = `device_${crypto.randomUUID()}`
  localStorage.setItem(DEVICE_STORAGE_KEY, deviceId)
  return deviceId
}

const buildOfflineUser = (deviceId: string): User => ({
  id: deviceId,
  email: `${deviceId}@local.device`,
})

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    mode: null,
    deviceId: null,
    isLoading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => {
      if (state.mode === 'online') {
        return Boolean(state.token) && Boolean(state.user)
      }
      if (state.mode === 'offline') {
        return Boolean(state.user)
      }
      return false
    },
    currentUser: (state) => state.user,
    hasOfflineSession: (state) => state.mode === 'offline' && Boolean(state.user),
    isModeSelected: (state) => state.mode !== null,
  },

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        if (!this.deviceId) {
          this.deviceId = getOrCreateDeviceId()
        }

        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
          throw new Error('Введите email и пароль')
        }

        this.mode = 'online'

        const { $api } = useNuxtApp()
        const response = await $api.auth.login({
          email: trimmedEmail,
          password,
        })

        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        const { trackLogin, setAnalyticsUserId } = useAnalytics()
        setAnalyticsUserId(this.user.id)
        trackLogin()

        return response
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Login failed'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.register({
          email: email.trim(),
          password,
        })

        this.mode = 'online'
        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        const { trackRegister, setAnalyticsUserId } = useAnalytics()
        setAnalyticsUserId(this.user.id)
        trackRegister()

        return response
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Registration failed'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      const userId = this.user?.id

      const { trackLogout, setAnalyticsUserId } = useAnalytics()
      trackLogout()
      setAnalyticsUserId(null)

      try {
        const { $api } = useNuxtApp()
        await $api.auth.logout()
      } catch {
        // Ignore logout errors.
      }

      this.token = null
      this.user = null
      this.mode = null
      this.error = null
      this.initialized = true
      this.clearStorage()

      if (userId) {
        await clearUserData(userId)
      }
    },

    async resetPassword(email: string) {
      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.auth.resetPassword({ email: email.trim() })
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Password reset failed'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async refreshToken() {
      if (this.mode !== 'online') {
        return false
      }

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.refresh()

        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        const { setAnalyticsUserId } = useAnalytics()
        setAnalyticsUserId(response.user.id)

        return true
      } catch {
        this.token = null
        this.initialized = true
        this.saveToStorage()
        return false
      }
    },

    async initializeAuth() {
      if (this.initialized) return this.isAuthenticated

      if (initializePromise) {
        return initializePromise
      }

      initializePromise = (async () => {
        try {
          this.loadFromStorage()

          if (!this.deviceId) {
            this.deviceId = getOrCreateDeviceId()
          }

          if (this.mode === 'offline') {
            if (!this.user) {
              this.user = buildOfflineUser(this.deviceId)
            }
            this.token = null
            this.initialized = true
            this.saveToStorage()
            return this.isAuthenticated
          }

          if (this.mode === 'online' && navigator.onLine) {
            await this.refreshToken().catch(() => false)
          }

          this.initialized = true
          this.saveToStorage()
          return this.isAuthenticated
        } finally {
          initializePromise = null
        }
      })()

      return initializePromise
    },

    async setMode(mode: AppMode) {
      this.mode = mode

      if (!this.deviceId) {
        this.deviceId = getOrCreateDeviceId()
      }

      if (mode === 'offline') {
        this.token = null
        if (!this.user) {
          this.user = buildOfflineUser(this.deviceId)
        }
      }

      if (mode === 'online') {
        this.token = null
      }

      this.initialized = true
      this.saveToStorage()
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    },

    setToken(token: string) {
      this.token = token
      this.saveToStorage()
    },

    setUser(user: User) {
      this.user = user
      this.deviceId = this.deviceId || user.id
      this.saveToStorage()
    },

    clearAuth() {
      this.token = null
      this.saveToStorage()
    },

    loadFromStorage() {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            user?: User
            token?: string | null
            mode?: AppMode | null
            deviceId?: string | null
          }

          if (parsed.user) this.user = parsed.user
          if (typeof parsed.token === 'string') this.token = parsed.token
          if (parsed.mode) this.mode = parsed.mode
          if (parsed.deviceId) this.deviceId = parsed.deviceId
        } catch {
          // Ignore broken storage.
        }
      }

      if (!this.mode) {
        const storedMode = localStorage.getItem(MODE_STORAGE_KEY)
        if (storedMode === 'online' || storedMode === 'offline') {
          this.mode = storedMode
        }
      }

      if (!this.deviceId) {
        this.deviceId = localStorage.getItem(DEVICE_STORAGE_KEY)
      }
    },

    saveToStorage() {
      const payload = {
        user: this.user,
        token: this.token,
        mode: this.mode,
        deviceId: this.deviceId,
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
      if (this.mode) {
        localStorage.setItem(MODE_STORAGE_KEY, this.mode)
      }
      if (this.deviceId) {
        localStorage.setItem(DEVICE_STORAGE_KEY, this.deviceId)
      }
    },

    clearStorage() {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(MODE_STORAGE_KEY)
    },
  },
})
