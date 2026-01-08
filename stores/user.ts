import { defineStore } from 'pinia'
import type { UserState, UserPreferences } from '~/types/api'
import { DEFAULT_PREFERENCES } from '~/types'

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
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to fetch user state'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async setInitialized() {
      try {
        const { $api } = useNuxtApp()
        await $api.user.updateState({ inited: true })
        this.inited = true
      } catch (err: unknown) {
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

      try {
        const { $api } = useNuxtApp()
        await $api.user.updateState({ preferences })
        this.hasRemotePreferences = true
      } catch (err: unknown) {
        // Rollback on error
        this.preferences = original
        this.hasRemotePreferences = originalHasRemote
        const error = err as Error
        this.error = error.message || 'Failed to update preferences'
        throw error
      }
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
