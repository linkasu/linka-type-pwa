import { defineStore } from 'pinia'
import type { User } from '../types/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
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
        this.user = response.user || { id: '', email }
        
        if (import.meta.client) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(this.user))
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

    async logout() {
      this.token = null
      this.user = null
      this.error = null

      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    loadFromStorage() {
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        const userJson = localStorage.getItem('auth_user')

        if (token) {
          this.token = token
          
          if (userJson && userJson !== 'undefined') {
            try {
              this.user = JSON.parse(userJson)
            } catch {
              this.user = { id: '', email: '' }
            }
          } else {
            this.user = { id: '', email: '' }
          }
        }
      }
    },

    setToken(token: string) {
      this.token = token
      if (import.meta.client) {
        localStorage.setItem('auth_token', token)
      }
    },
  },
})

