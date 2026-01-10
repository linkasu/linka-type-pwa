import { defineStore } from 'pinia'
import type {
  DialogSuggestion,
  DialogSuggestionApplyItem,
  DialogSuggestionApplyResult,
} from '~/types/api'
import { useAuthStore } from '~/stores/auth'
import { isOffline } from '~/utils/offline'

interface DialogSuggestionsState {
  suggestions: DialogSuggestion[]
  isLoading: boolean
  error: string | null
  lastFetch: number | null
}

export const useDialogSuggestionsStore = defineStore('dialogSuggestions', {
  state: (): DialogSuggestionsState => ({
    suggestions: [],
    isLoading: false,
    error: null,
    lastFetch: null,
  }),

  getters: {
    pendingCount: (state) => state.suggestions.length,
  },

  actions: {
    async fetchSuggestions(force = false): Promise<DialogSuggestion[]> {
      if (isOffline()) return this.suggestions

      const authStore = useAuthStore()
      if (!authStore.token) return this.suggestions

      if (!force && this.isLoading) return this.suggestions

      this.isLoading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const suggestions = await $api.dialog.listSuggestions('pending', 200)
        this.suggestions = suggestions
        this.lastFetch = Date.now()
        return suggestions
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to load suggestions'
        return this.suggestions
      } finally {
        this.isLoading = false
      }
    },

    async applySuggestions(items: DialogSuggestionApplyItem[]): Promise<DialogSuggestionApplyResult> {
      const { $api } = useNuxtApp()
      const result = await $api.dialog.applySuggestions(items)
      if (result.applied?.length) {
        this.removeSuggestions(result.applied)
      }
      return result
    },

    async dismissSuggestions(ids: string[]): Promise<void> {
      const { $api } = useNuxtApp()
      await $api.dialog.dismissSuggestions(ids)
      this.removeSuggestions(ids)
    },

    removeSuggestions(ids: string[]) {
      const toRemove = new Set(ids)
      this.suggestions = this.suggestions.filter(item => !toRemove.has(item.id))
    },
  },
})
