import { defineStore } from 'pinia'
import { DEFAULT_QUICKES } from '~/types'
import type { OfflineQueueItem } from '~/types/offline'
import { useAuthStore } from '~/stores/auth'
import { isOffline, shouldQueueOffline } from '~/utils/offline'
import { addQueueItem, getQuickes as getCachedQuickes, setQuickes as setQuickesCache } from '~/utils/offlineDb'

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
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      let cached: string[] | null = null

      if (import.meta.client && userId) {
        cached = await getCachedQuickes(userId)
        if (cached && cached.length > 0) {
          this.setQuickes(cached)
        }
      }

      if (isOffline()) {
        this.isLoading = false
        return
      }

      try {
        const { $api } = useNuxtApp()
        const response = await $api.quickes.get()
        this.quickes = response.quickes
        if (import.meta.client && userId) {
          await setQuickesCache(userId, response.quickes)
        }
      } catch (err: unknown) {
        const error = err as Error
        if (!cached || !shouldQueueOffline(err)) {
          this.error = error.message || 'Failed to fetch quickes'
        }
        // Keep defaults or cached on error
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
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        await setQuickesCache(userId, quickes)
      }

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline update')
          await addQueueItem({
            userId,
            op: 'quickes_update',
            payload: { quickes },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }

        const { $api } = useNuxtApp()
        await $api.quickes.update({ quickes })
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await addQueueItem({
            userId,
            op: 'quickes_update',
            payload: { quickes },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }
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
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        void setQuickesCache(userId, this.quickes)
      }
    },

    resetToDefaults() {
      this.quickes = [...DEFAULT_QUICKES]
    },
  },
})
