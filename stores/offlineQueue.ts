import { defineStore } from 'pinia'
import type { Category, Statement } from '~/types/api'
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
  SyncConflict,
  CategoryUpdatePayloadWithOriginal,
  StatementUpdatePayloadWithOriginal,
} from '~/types/offline'
import { getQueueItems, deleteQueueItem, updateQueueItem } from '~/utils/offlineDb'
import { shouldQueueOffline, isOffline, generateTempId } from '~/utils/offline'
import { applyIdMappingToItem } from './offlineQueue/idMapping'
import { resolveSyncConflict } from './offlineQueue/conflictResolution'
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
      const conflict = this.conflicts.find((c) => c.id === conflictId)
      if (!conflict) return

      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (!userId) return

      const { api } = useAppServices()
      const categoriesStore = useCategoriesStore()
      const statementsStore = useStatementsStore()

      try {
        await resolveSyncConflict(conflict, resolution, {
          api,
          categoriesStore,
          statementsStore,
        })

        // Remove from queue
        if (conflict.localChange.id !== undefined) {
          await deleteQueueItem(conflict.localChange.id)
          this.pendingCount -= 1
        }

        // Remove conflict from list
        this.conflicts = this.conflicts.filter((c) => c.id !== conflictId)
      } catch (err: unknown) {
        const error = err as Error
        this.lastError = error.message || 'Failed to resolve conflict'
      }
    },

    dismissConflict(conflictId: string) {
      this.conflicts = this.conflicts.filter((c) => c.id !== conflictId)
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

        const { api } = useAppServices()

        for (let index = 0; index < items.length; index++) {
          const item = items[index]

          try {
            switch (item.op) {
              case 'category_create': {
                const payload = item.payload as CategoryCreatePayload
                const created = await api.categories.create({
                  label: payload.category.label,
                  created: payload.category.created,
                  aiUse: payload.category.aiUse,
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
                const payload = item.payload as CategoryUpdatePayloadWithOriginal
                const resolvedId = idMap.get(payload.id) ?? payload.id

                // Check for conflicts by fetching current server state
                if (payload.originalLabel !== undefined) {
                  try {
                    const current = await api.categories.getById(resolvedId)
                    // Conflict: server has different value than our original
                    if (current.label !== payload.originalLabel || current.aiUse !== payload.originalAiUse) {
                      this.conflicts.push({
                        id: generateTempId('conflict'),
                        entityType: 'category',
                        entityId: resolvedId,
                        conflictType: 'update_update',
                        localChange: item,
                        remoteData: current,
                        localData: { ...current, label: payload.label, aiUse: payload.aiUse ?? current.aiUse } as Category,
                        createdAt: Date.now(),
                      })
                      // Skip this item, wait for conflict resolution
                      continue
                    }
                  } catch (fetchErr: unknown) {
                    const fetchError = fetchErr as { response?: { status?: number } }
                    if (fetchError.response?.status === 404) {
                      // Category was deleted on server
                      this.conflicts.push({
                        id: generateTempId('conflict'),
                        entityType: 'category',
                        entityId: resolvedId,
                        conflictType: 'update_delete',
                        localChange: item,
                        createdAt: Date.now(),
                      })
                      continue
                    }
                    throw fetchErr
                  }
                }

                const updated = await api.categories.update(resolvedId, { label: payload.label, aiUse: payload.aiUse })
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
                await api.categories.delete(resolvedId)
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
                const created = await api.statements.create({
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
                const payload = item.payload as StatementUpdatePayloadWithOriginal
                const resolvedId = idMap.get(payload.id) ?? payload.id

                // Check for conflicts by fetching current server state
                if (payload.originalText !== undefined) {
                  try {
                    const current = await api.statements.getById(resolvedId)
                    // Conflict: server has different value than our original
                    if (current.text !== payload.originalText) {
                      this.conflicts.push({
                        id: generateTempId('conflict'),
                        entityType: 'statement',
                        entityId: resolvedId,
                        conflictType: 'update_update',
                        localChange: item,
                        remoteData: current,
                        localData: { ...current, text: payload.text } as Statement,
                        createdAt: Date.now(),
                      })
                      // Skip this item, wait for conflict resolution
                      continue
                    }
                  } catch (fetchErr: unknown) {
                    const fetchError = fetchErr as { response?: { status?: number } }
                    if (fetchError.response?.status === 404) {
                      // Statement was deleted on server
                      this.conflicts.push({
                        id: generateTempId('conflict'),
                        entityType: 'statement',
                        entityId: resolvedId,
                        conflictType: 'update_delete',
                        localChange: item,
                        createdAt: Date.now(),
                      })
                      continue
                    }
                    throw fetchErr
                  }
                }

                const updated = await api.statements.update(resolvedId, { text: payload.text })
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
                await api.statements.delete(resolvedId)
                await statementsStore.removeStatement(resolvedId)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'quickes_update': {
                const payload = item.payload as QuickesUpdatePayload
                await api.quickes.update({ quickes: payload.quickes })
                quickesStore.setQuickes(payload.quickes)
                if (item.id !== undefined) {
                  await deleteQueueItem(item.id)
                }
                this.pendingCount -= 1
                break
              }
              case 'user_prefs_update': {
                const payload = item.payload as UserPrefsUpdatePayload
                await api.user.updateState({ preferences: payload.preferences })
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
