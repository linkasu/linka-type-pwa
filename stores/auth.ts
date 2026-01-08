import { defineStore } from 'pinia'
import type { User } from '~/types/api'

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
    },

    async refreshToken() {
      if (!import.meta.client) return false
      
      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.refresh()
        
        this.token = response.token
        this.user = response.user
        this.initialized = true
        
        return true
      } catch {
        this.token = null
        this.user = null
        this.initialized = true
        return false
      }
    },

    async initializeAuth() {
      if (this.initialized) return this.isAuthenticated
      
      if (!import.meta.client) {
        this.initialized = true
        return false
      }
      
      return await this.refreshToken()
    },

    setToken(token: string) {
      this.token = token
    },

    setUser(user: User) {
      this.user = user
    },

    clearAuth() {
      this.token = null
      this.user = null
      this.error = null
    },
  },
})
