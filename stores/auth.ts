import { defineStore } from 'pinia'
import type { User } from '~/types/api'
import type { AppMode, AuthState, AuthStoreContext } from './auth/types'
import {
  loginAction,
  logoutAction,
  refreshTokenAction,
  registerAction,
  resetPasswordAction,
} from './auth/remoteActions'
import {
  clearStorageAction,
  initializeAuthAction,
  loadFromStorageAction,
  saveToStorageAction,
  setModeAction,
} from './auth/sessionActions'

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
    currentUser: state => state.user,
    hasOfflineSession: state => state.mode === 'offline' && Boolean(state.user),
    isModeSelected: state => state.mode !== null,
  },

  actions: {
    async login(email: string, password: string) {
      return loginAction(this as AuthStoreContext, email, password)
    },

    async register(email: string, password: string) {
      return registerAction(this as AuthStoreContext, email, password)
    },

    async logout() {
      await logoutAction(this as AuthStoreContext)
    },

    async resetPassword(email: string) {
      await resetPasswordAction(this as AuthStoreContext, email)
    },

    async refreshToken() {
      return refreshTokenAction(this as AuthStoreContext)
    },

    async initializeAuth() {
      return initializeAuthAction(this as AuthStoreContext)
    },

    async setMode(mode: AppMode) {
      await setModeAction(this as AuthStoreContext, mode)
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
      loadFromStorageAction(this as AuthStoreContext)
    },

    saveToStorage() {
      saveToStorageAction(this as AuthStoreContext)
    },

    clearStorage() {
      clearStorageAction()
    },
  },
})
