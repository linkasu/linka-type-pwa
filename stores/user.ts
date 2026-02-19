import { defineStore } from 'pinia'
import type { UserState, UserPreferences } from '~/types/api'
import { isOffline, shouldQueueOffline } from '~/utils/offline'
import { useAuthStore } from './auth'
import { useCategoriesStore } from './categories'
import { useQuickesStore } from './quickes'
import { useSettingsStore } from './settings'
import { useStatementsStore } from './statements'
import { loadCachedUserState, saveCachedUserState } from './user/cache'
import { hasUserPreferences, mergeUserPreferences } from './user/preferences'

interface UserStoreState {
  inited: boolean | null
  preferences: UserPreferences
  hasRemotePreferences: boolean
  isLoading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserStoreState => ({
    inited: null,
    preferences: mergeUserPreferences(),
    hasRemotePreferences: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    isInitialized: (state) => state.inited === true,
    needsSetup: (state) => state.inited === false,
  },

  actions: {
    async fetchState() {
      this.isLoading = true
      this.error = null
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        const cached = await loadCachedUserState(userId)
        if (cached) {
          this.inited = cached.inited
          this.preferences = mergeUserPreferences(cached.preferences)
          this.hasRemotePreferences = hasUserPreferences(cached.preferences)
        }
      }
      if (import.meta.client && isOffline()) {
        this.isLoading = false
        return
      }
      try {
        const { api } = useAppServices()
        const state = await api.user.getState()
        this.inited = state.inited
        this.preferences = mergeUserPreferences(state.preferences)
        this.hasRemotePreferences = hasUserPreferences(state.preferences)

        if (this.hasRemotePreferences && import.meta.client) {
          useSettingsStore().applyUserPreferences(this.preferences)
        }
        if (import.meta.client && userId) {
          await saveCachedUserState(userId, state.inited, this.preferences)
        }
      } catch (err: unknown) {
        if (this.inited !== null) {
          this.isLoading = false
          return
        }
        const error = err as Error
        this.error = error.message || 'Failed to fetch user state'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async setInitialized() {
      this.inited = true
      this.error = null

      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (import.meta.client && userId) {
        await saveCachedUserState(userId, true, this.preferences)
      }

      try {
        if (isOffline() || authStore.mode === 'offline') {
          return
        }

        const { api } = useAppServices()
        await api.user.updateState({ inited: true })
      } catch (err: unknown) {
        if (shouldQueueOffline(err)) {
          return
        }
        const error = err as Error
        this.error = error.message || 'Failed to update user state'
        throw error
      }
    },

    async updatePreferences(preferences: Partial<UserPreferences>) {
      const original = { ...this.preferences }
      const originalHasRemote = this.hasRemotePreferences
      Object.assign(this.preferences, preferences)
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId && this.inited !== null) {
        await saveCachedUserState(userId, this.inited, this.preferences)
      }

      try {
        if (isOffline() || authStore.mode === 'offline') {
          return
        }

        const { api } = useAppServices()
        await api.user.updateState({ preferences })
        this.hasRemotePreferences = true
      } catch (err: unknown) {
        if (shouldQueueOffline(err)) {
          return
        }
        this.preferences = original
        this.hasRemotePreferences = originalHasRemote
        if (import.meta.client && userId && this.inited !== null) {
          await saveCachedUserState(userId, this.inited, original)
        }
        const error = err as Error
        this.error = error.message || 'Failed to update preferences'
        throw error
      }
    },

    applyPreferencesPatch(preferences: Partial<UserPreferences>) {
      Object.assign(this.preferences, preferences)
      this.hasRemotePreferences = true
    },

    updateState(state: UserState) {
      this.inited = state.inited
      if (state.preferences) {
        this.preferences = mergeUserPreferences(state.preferences)
        this.hasRemotePreferences = hasUserPreferences(state.preferences)
        if (import.meta.client) {
          useSettingsStore().applyUserPreferences(this.preferences)
        }
      }
    },

    async deleteAccount(deleteFirebase = false) {
      this.isLoading = true
      this.error = null

      try {
        const { api } = useAppServices()
        await api.user.deleteAccount({ deleteFirebase })
        useAuthStore().logout()
        useCategoriesStore().clearCache()
        useStatementsStore().clearCache()
        useQuickesStore().resetToDefaults()

        this.inited = null
        this.preferences = mergeUserPreferences()
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to delete account'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    reset() {
      this.inited = null
      this.preferences = mergeUserPreferences()
      this.hasRemotePreferences = false
      this.error = null
    },
  },
})
