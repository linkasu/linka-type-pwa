import { defineStore } from 'pinia'
import type {
  CategoryCreatePayload,
  CategoryUpdatePayload,
  CategoryDeletePayload,
  StatementCreatePayload,
  StatementUpdatePayload,
  StatementDeletePayload,
  QuickesUpdatePayload,
  UserPrefsUpdatePayload,
  OfflineQueueItem,
} from '~/types/offline'
import { getQueueItems, deleteQueueItem, updateQueueItem } from '~/utils/offlineDb'
import { shouldQueueOffline, isOffline } from '~/utils/offline'
import { useAuthStore } from './auth'
import { useCategoriesStore } from './categories'
import { useStatementsStore } from './statements'
import { useQuickesStore } from './quickes'
import { useSettingsStore } from './settings'
import { useUserStore } from './user'

const applyIdMappingToItem = (
  item: OfflineQueueItem,
  fromId: string,
  toId: string,
): boolean => {
  let changed = false

  switch (item.op) {
    case 'category_create': {
      const payload = item.payload as CategoryCreatePayload
      if (payload.category.id === fromId) {
        payload.category.id = toId
        changed = true
      }
      break
    }
    case 'category_update': {
      const payload = item.payload as CategoryUpdatePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'category_delete': {
      const payload = item.payload as CategoryDeletePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'statement_create': {
      const payload = item.payload as StatementCreatePayload
      if (payload.statement.id === fromId) {
        payload.statement.id = toId
        changed = true
      }
      if (payload.statement.categoryId === fromId) {
        payload.statement.categoryId = toId
        changed = true
      }
      break
    }
    case 'statement_update': {
      const payload = item.payload as StatementUpdatePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'statement_delete': {
      const payload = item.payload as StatementDeletePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      if (payload.categoryId === fromId) {
        payload.categoryId = toId
        changed = true
      }
      break
    }
    default:
      break
  }

  return changed
}

export const useOfflineQueueStore = defineStore('offlineQueue', {
  state: () => ({
    pendingCount: 0,
    isFlushing: false,
    lastError: null as string | null,
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

    async flush() {
      if (!import.meta.client) return
      if (this.isFlushing || isOffline()) return

      const authStore = useAuthStore()
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

      const categoriesStore = useCategoriesStore()
      const statementsStore = useStatementsStore()
      const quickesStore = useQuickesStore()
      const settingsStore = useSettingsStore()
      const userStore = useUserStore()

      const idMap = new Map<string, string>()

      try {
        const items = await getQueueItems(userId)
        this.pendingCount = items.length
        if (items.length === 0) return

        const { $api } = useNuxtApp()

        for (let index = 0; index < items.length; index++) {
          const item = items[index]

          try {
            switch (item.op) {
              case 'category_create': {
                const payload = item.payload as CategoryCreatePayload
                const created = await $api.categories.create({
                  label: payload.category.label,
                  created: payload.category.created,
                })
                await categoriesStore.replaceCategoryId(payload.category.id, created)
                await statementsStore.remapCategoryId(payload.category.id, created.id)
                idMap.set(payload.category.id, created.id)

                for (let i = index + 1; i < items.length; i++) {
                  const updated = applyIdMappingToItem(items[i], payload.category.id, created.id)
                  if (updated) {
                    await updateQueueItem(items[i])
                  }
                }

                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'category_update': {
                const payload = item.payload as CategoryUpdatePayload
                const resolvedId = idMap.get(payload.id) ?? payload.id
                const updated = await $api.categories.update(resolvedId, { label: payload.label })
                await categoriesStore.updateCategory(updated)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'category_delete': {
                const payload = item.payload as CategoryDeletePayload
                const resolvedId = idMap.get(payload.id) ?? payload.id
                await $api.categories.delete(resolvedId)
                await categoriesStore.removeCategory(resolvedId)
                await statementsStore.removeStatementsByCategory(resolvedId)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'statement_create': {
                const payload = item.payload as StatementCreatePayload
                const resolvedCategoryId = idMap.get(payload.statement.categoryId) ?? payload.statement.categoryId
                const created = await $api.statements.create({
                  categoryId: resolvedCategoryId,
                  text: payload.statement.text,
                  created: payload.statement.created,
                })
                await statementsStore.replaceStatementId(payload.statement.id, created)
                idMap.set(payload.statement.id, created.id)

                for (let i = index + 1; i < items.length; i++) {
                  const updated = applyIdMappingToItem(items[i], payload.statement.id, created.id)
                  if (updated) {
                    await updateQueueItem(items[i])
                  }
                }

                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'statement_update': {
                const payload = item.payload as StatementUpdatePayload
                const resolvedId = idMap.get(payload.id) ?? payload.id
                const updated = await $api.statements.update(resolvedId, { text: payload.text })
                await statementsStore.updateStatement(updated)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'statement_delete': {
                const payload = item.payload as StatementDeletePayload
                const resolvedId = idMap.get(payload.id) ?? payload.id
                await $api.statements.delete(resolvedId)
                await statementsStore.removeStatement(resolvedId)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'quickes_update': {
                const payload = item.payload as QuickesUpdatePayload
                await $api.quickes.update({ quickes: payload.quickes })
                quickesStore.setQuickes(payload.quickes)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'user_prefs_update': {
                const payload = item.payload as UserPrefsUpdatePayload
                await $api.user.updateState({ preferences: payload.preferences })
                settingsStore.applySettingsPatch(payload.preferences)
                userStore.applyPreferencesPatch(payload.preferences)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              default:
                break
            }
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
