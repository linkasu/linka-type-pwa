import { defineStore } from 'pinia'
import { DEFAULT_QUICKES } from '~/types'

interface QuickesState {
  quickes: string[]
  isLoading: boolean
  error: string | null
}

const QUICKES_COUNT = 6

export const useQuickesStore = defineStore('quickes', {
  state: (): QuickesState => ({
    quickes: [...DEFAULT_QUICKES],
    isLoading: false,
    error: null,
  }),

  getters: {
    getByIndex: (state) => (index: number) => state.quickes[index] || '',
  },

  actions: {
    async fetchQuickes() {
      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.quickes.get()
        this.quickes = response.quickes
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to fetch quickes'
        // Keep defaults on error
      } finally {
        this.isLoading = false
      }
    },

    async updateQuickes(quickes: string[]) {
      if (quickes.length !== QUICKES_COUNT) {
        throw new Error(`Quickes must have exactly ${QUICKES_COUNT} items`)
      }

      const original = [...this.quickes]
      
      // Optimistic update
      this.quickes = quickes

      try {
        const { $api } = useNuxtApp()
        await $api.quickes.update({ quickes })
      } catch (err: unknown) {
        // Rollback on error
        this.quickes = original
        const error = err as Error
        this.error = error.message || 'Failed to update quickes'
        throw error
      }
    },

    async updateSingleQuicke(index: number, text: string) {
      if (index < 0 || index >= QUICKES_COUNT) {
        throw new Error(`Index must be between 0 and ${QUICKES_COUNT - 1}`)
      }

      const newQuickes = [...this.quickes]
      newQuickes[index] = text
      await this.updateQuickes(newQuickes)
    },

    setQuickes(quickes: string[]) {
      this.quickes = quickes.slice(0, QUICKES_COUNT)
      // Pad with defaults if needed
      while (this.quickes.length < QUICKES_COUNT) {
        this.quickes.push(DEFAULT_QUICKES[this.quickes.length] || '')
      }
    },

    resetToDefaults() {
      this.quickes = [...DEFAULT_QUICKES]
    },
  },
})

