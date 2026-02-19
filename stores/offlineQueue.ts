import { defineStore } from 'pinia'
import type { SyncConflict } from '~/types/offline'
import { getQueueItems, deleteQueueItem } from '~/utils/offlineDb'
import { shouldQueueOffline, isOffline } from '~/utils/offline'
import { resolveSyncConflict } from './offlineQueue/conflictResolution'
import { processQueueItem } from './offlineQueue/processQueueItem'
import type { QueueFlushContext } from './offlineQueue/flushTypes'
import { useAuthStore } from './auth'
import { useCategoriesStore } from './categories'
import { useStatementsStore } from './statements'
import { useQuickesStore } from './quickes'
import { useSettingsStore } from './settings'
import { useUserStore } from './user'

export const useOfflineQueueStore = defineStore('offlineQueue', {
  state: () => ({
    pendingCount: 0,
    isFlushing: false,
    lastError: null as string | null,
    conflicts: [] as SyncConflict[],
  }),

  actions: {
    async hydrate() {
      if (!import.meta.client) return
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (!userId) {
        this.pendingCount = 0
        return
      }

      const items = await getQueueItems(userId)
      this.pendingCount = items.length
    },

    async resolveConflict(conflictId: string, resolution: 'local' | 'remote') {
      const conflict = this.conflicts.find(c => c.id === conflictId)
      if (!conflict) return

      const { api } = useAppServices()
      const categoriesStore = useCategoriesStore()
      const statementsStore = useStatementsStore()

      try {
        await resolveSyncConflict(conflict, resolution, {
          api,
          categoriesStore,
          statementsStore,
        })

        if (conflict.localChange.id !== undefined) {
          await deleteQueueItem(conflict.localChange.id)
          this.pendingCount -= 1
        }

        this.conflicts = this.conflicts.filter(c => c.id !== conflictId)
      } catch (err: unknown) {
        const error = err as Error
        this.lastError = error.message || 'Failed to resolve conflict'
      }
    },

    dismissConflict(conflictId: string) {
      this.conflicts = this.conflicts.filter(c => c.id !== conflictId)
    },

    clearConflicts() {
      this.conflicts = []
    },

    async flush() {
      if (!import.meta.client) return
      if (this.isFlushing || isOffline()) return

      const authStore = useAuthStore()
      if (authStore.mode !== 'online') return

      const userId = authStore.user?.id
      if (!userId) {
        this.pendingCount = 0
        return
      }

      if (!authStore.token) {
        const refreshed = await authStore.refreshToken()
        if (!refreshed) {
          this.lastError = 'Failed to refresh token'
          return
        }
      }

      this.isFlushing = true
      this.lastError = null

      const stores = {
        categoriesStore: useCategoriesStore(),
        statementsStore: useStatementsStore(),
        quickesStore: useQuickesStore(),
        settingsStore: useSettingsStore(),
        userStore: useUserStore(),
      }

      const idMap = new Map<string, string>()

      try {
        const items = await getQueueItems(userId)
        this.pendingCount = items.length
        if (items.length === 0) return

        const { api } = useAppServices()

        for (let index = 0; index < items.length; index += 1) {
          const item = items[index]

          try {
            const context: QueueFlushContext = {
              api,
              stores,
              items,
              index,
              item,
              idMap,
              conflicts: this.conflicts,
            }

            const result = await processQueueItem(context)
            if (result !== 'processed') {
              continue
            }

            if (item.id !== undefined) {
              await deleteQueueItem(item.id)
            }
            this.pendingCount -= 1
          } catch (err: unknown) {
            if (shouldQueueOffline(err)) {
              this.lastError = 'Offline, retry later'
              break
            }
            const error = err as Error
            this.lastError = error.message || 'Failed to sync offline queue'
            break
          }
        }
      } finally {
        this.isFlushing = false
      }
    },
  },
})
