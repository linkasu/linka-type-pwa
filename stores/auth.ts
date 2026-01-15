import { defineStore } from 'pinia'
import type { User } from '~/types/api'
import { clearUserData } from '~/utils/offlineDb'
import { useAnalytics } from '~/composables/useAnalytics'

const AUTH_STORAGE_KEY = 'linka_auth'

// Promise lock to prevent race conditions in initializeAuth
let initializePromise: Promise<boolean> | null = null

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    hasOfflineSession: (state) => !!state.user && !state.token,
  },

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.login({ email, password })

        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        // Track login event
        if (import.meta.client) {
          const { trackLogin, setAnalyticsUserId } = useAnalytics()
          setAnalyticsUserId(response.user.id)
          trackLogin()
        }

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
        const response = await $api.auth.register({ email, password })

        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        // Track register event
        if (import.meta.client) {
          const { trackRegister, setAnalyticsUserId } = useAnalytics()
          setAnalyticsUserId(response.user.id)
          trackRegister()
        }

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

      // Track logout event before clearing state
      if (import.meta.client) {
        const { trackLogout, setAnalyticsUserId } = useAnalytics()
        trackLogout()
        setAnalyticsUserId(null)
      }

      try {
        const { $api } = useNuxtApp()
        await $api.auth.logout()
      } catch {
        // ignore logout errors
      }

      this.token = null
      this.user = null
      this.error = null
      this.initialized = true
      this.clearStorage()
      if (import.meta.client && userId) {
        await clearUserData(userId)
      }
    },

    async refreshToken() {
      if (!import.meta.client) return false

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.refresh()

        this.token = response.token
        this.user = response.user
        this.initialized = true
        this.saveToStorage()

        // Set user ID for analytics on successful refresh
        const { setAnalyticsUserId } = useAnalytics()
        setAnalyticsUserId(response.user.id)

        return true
      } catch {
        this.token = null
        this.user = null
        this.initialized = true
        this.clearStorage()
        return false
      }
    },

    async initializeAuth() {
      if (this.initialized) return this.isAuthenticated

      if (!import.meta.client) {
        this.initialized = true
        return false
      }

      // Use promise lock to prevent race conditions
      if (initializePromise) {
        return initializePromise
      }

      initializePromise = (async () => {
        try {
          this.loadFromStorage()
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            this.initialized = true
            return this.isAuthenticated
          }

          return await this.refreshToken()
        } finally {
          initializePromise = null
        }
      })()

      return initializePromise
    },

    setToken(token: string) {
      this.token = token
    },

    setUser(user: User) {
      this.user = user
      this.saveToStorage()
    },

    clearAuth() {
      const userId = this.user?.id
      this.token = null
      this.user = null
      this.error = null
      this.clearStorage()
      if (import.meta.client && userId) {
        clearUserData(userId).catch((err) => {
          console.error('Failed to clear user data:', err)
        })
      }
    },

    loadFromStorage() {
      if (!import.meta.client) return
      if (this.user) return
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!stored) return
      try {
        const parsed = JSON.parse(stored) as { user?: User }
        if (parsed.user) {
          this.user = parsed.user
        }
      } catch {
        // Ignore invalid storage
      }
    },

    saveToStorage() {
      if (!import.meta.client) return
      if (!this.user) {
        this.clearStorage()
        return
      }
      const payload = { user: this.user }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
    },

    clearStorage() {
      if (!import.meta.client) return
      localStorage.removeItem(AUTH_STORAGE_KEY)
    },
  },
})
