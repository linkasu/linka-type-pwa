import { defineStore } from 'pinia'
import type { UserState, UserPreferences } from '~/types/api'
import { DEFAULT_PREFERENCES } from '~/types'
import { getUserState, setUserState } from '~/utils/offlineDb'
import { isOffline, shouldQueueOffline } from '~/utils/offline'

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
    preferences: { ...DEFAULT_PREFERENCES },
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

      // Get userId from auth store
      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      // 1. Try loading from IndexedDB cache first
      if (import.meta.client && userId) {
        try {
          const cached = await getUserState(userId)
          if (cached) {
            this.inited = cached.inited
            this.preferences = { ...DEFAULT_PREFERENCES, ...cached.preferences }
            this.hasRemotePreferences = Object.keys(cached.preferences).length > 0
          }
        } catch {
          // Ignore cache errors
        }
      }

      // 2. If offline — exit without error (use cached data)
      if (import.meta.client && isOffline()) {
        this.isLoading = false
        return
      }

      // 3. Fetch from server and save to cache
      try {
        const { $api } = useNuxtApp()
        const state = await $api.user.getState()
        this.inited = state.inited
        this.preferences = { ...DEFAULT_PREFERENCES, ...state.preferences }
        this.hasRemotePreferences = Boolean(
          state.preferences && Object.keys(state.preferences).length > 0,
        )

        if (this.hasRemotePreferences && import.meta.client) {
          const { useSettingsStore } = await import('./settings')
          useSettingsStore().applyUserPreferences(this.preferences)
        }

        // Save to cache
        if (import.meta.client && userId) {
          await setUserState(userId, {
            inited: state.inited,
            preferences: this.preferences,
          })
        }
      } catch (err: unknown) {
        // If we have cached data, don't throw error for network failures
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

      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (import.meta.client && userId) {
        await setUserState(userId, {
          inited: true,
          preferences: this.preferences,
        })
      }

      try {
        if (isOffline() || authStore.mode === 'offline') {
          return
        }

        const { $api } = useNuxtApp()
        await $api.user.updateState({ inited: true })
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

      // Optimistic update
      Object.assign(this.preferences, preferences)

      // Get userId
      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      // Update cache immediately (optimistic)
      if (import.meta.client && userId && this.inited !== null) {
        await setUserState(userId, {
          inited: this.inited,
          preferences: this.preferences,
        })
      }

      try {
        if (isOffline() || authStore.mode === 'offline') {
          return
        }

        const { $api } = useNuxtApp()
        await $api.user.updateState({ preferences })
        this.hasRemotePreferences = true
      } catch (err: unknown) {
        if (shouldQueueOffline(err)) {
          return
        }
        // Rollback on error
        this.preferences = original
        this.hasRemotePreferences = originalHasRemote
        // Rollback cache
        if (import.meta.client && userId && this.inited !== null) {
          await setUserState(userId, {
            inited: this.inited,
            preferences: original,
          })
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
        this.preferences = { ...DEFAULT_PREFERENCES, ...state.preferences }
        this.hasRemotePreferences = Object.keys(state.preferences).length > 0
        if (import.meta.client) {
          import('./settings').then(({ useSettingsStore }) => {
            useSettingsStore().applyUserPreferences(this.preferences)
          })
        }
      }
    },

    async deleteAccount(deleteFirebase = false) {
      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.user.deleteAccount({ deleteFirebase })
        
        // Clear all stores
        const { useAuthStore } = await import('./auth')
        const { useCategoriesStore } = await import('./categories')
        const { useStatementsStore } = await import('./statements')
        const { useQuickesStore } = await import('./quickes')
        
        useAuthStore().logout()
        useCategoriesStore().clearCache()
        useStatementsStore().clearCache()
        useQuickesStore().resetToDefaults()
        
        this.inited = null
        this.preferences = { ...DEFAULT_PREFERENCES }
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
      this.preferences = { ...DEFAULT_PREFERENCES }
      this.hasRemotePreferences = false
      this.error = null
    },
  },
})
