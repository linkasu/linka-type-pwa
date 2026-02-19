import { defineStore } from 'pinia'
import type { Statement } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { useAuthStore } from '~/stores/auth'
import { generateTempId, isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  addQueueItem,
  clearStatementsByCategory,
  deleteStatement as deleteStatementCache,
  getQueueItems,
  getStatementsByCategory as getCachedStatementsByCategory,
  remapStatementsCategoryId,
  replaceStatementId as replaceStatementIdCache,
  replaceStatementsForCategory,
  upsertStatement,
} from '~/utils/offlineDb'
import {
  addStatementToState,
  getStatementsByCategory,
  remapCategoryIdInState,
  removeStatementFromState,
  replaceStatementIdInState,
  setCategoryStatementsInState,
} from './statements/state'
import { applyPendingStatementQueue } from './statements/queue'

interface StatementsState {
  statements: Map<string, Statement>
  byCategoryId: Map<string, Set<string>>
  isLoading: boolean
  error: string | null
  loadedCategories: Set<string>
}

const resolveLocalUserId = (): string | null => {
  const authStore = useAuthStore()
  return authStore.user?.id || authStore.deviceId || null
}

export const useStatementsStore = defineStore('statements', {
  state: (): StatementsState => ({
    statements: new Map(),
    byCategoryId: new Map(),
    isLoading: false,
    error: null,
    loadedCategories: new Set(),
  }),

  getters: {
    getById: (state) => (id: string) => state.statements.get(id),

    getByCategoryId: (state) => (categoryId: string): Statement[] =>
      getStatementsByCategory(state, categoryId),

    isCategoryLoaded: (state) => (categoryId: string) => 
      state.loadedCategories.has(categoryId),
  },

  actions: {
    async fetchByCategory(categoryId: string, force = false): Promise<Statement[]> {
      if (!force && this.loadedCategories.has(categoryId)) {
        return this.getByCategoryId(categoryId)
      }

      this.isLoading = true
      this.error = null
      const userId = resolveLocalUserId()

      let cached: Statement[] = []
      if (import.meta.client && userId) {
        cached = await getCachedStatementsByCategory(userId, categoryId)
        if (cached.length > 0) {
          this.setCategoryStatements(categoryId, cached)
        }
      }

      if (isOffline()) {
        this.loadedCategories.add(categoryId)
        this.isLoading = false
        return this.getByCategoryId(categoryId)
      }

      try {
        const { api } = useAppServices()
        const statements = await api.statements.getByCategory(categoryId)
        this.setCategoryStatements(categoryId, statements)
        this.loadedCategories.add(categoryId)
        if (import.meta.client && userId) {
          await this.applyPendingQueue(userId, categoryId)
          await replaceStatementsForCategory(userId, categoryId, this.getByCategoryId(categoryId))
        }

        return this.getByCategoryId(categoryId)
      } catch (err: unknown) {
        if (!shouldQueueOffline(err)) {
          const error = err as Error
          this.error = error.message || 'Failed to fetch statements'
          throw error
        }
        return this.getByCategoryId(categoryId)
      } finally {
        this.isLoading = false
      }
    },

    async createStatement(categoryId: string, text: string): Promise<Statement> {
      this.error = null
      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline create')
          const statement: Statement = {
            id: generateTempId('stmt'),
            categoryId,
            text,
            created: Date.now(),
          }
          this.addStatementToCategory(statement)
          await upsertStatement(userId, statement)
          await addQueueItem({
            userId,
            op: 'statement_create',
            payload: { statement },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return statement
        }

        const { api } = useAppServices()
        const statement = await api.statements.create({ categoryId, text, created: Date.now() })
        this.addStatementToCategory(statement)
        if (import.meta.client && userId) {
          await upsertStatement(userId, statement)
        }
        return statement
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          const statement: Statement = {
            id: generateTempId('stmt'),
            categoryId,
            text,
            created: Date.now(),
          }
          this.addStatementToCategory(statement)
          await upsertStatement(userId, statement)
          await addQueueItem({
            userId,
            op: 'statement_create',
            payload: { statement },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return statement
        }
        const error = err as Error
        this.error = error.message || 'Failed to create statement'
        throw error
      }
    },

    async updateStatementText(id: string, text: string): Promise<Statement> {
      const original = this.statements.get(id)
      if (!original) throw new Error('Statement not found')

      // Optimistic update
      this.statements.set(id, { ...original, text })

      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline update')
          await upsertStatement(userId, { ...original, text })
          await addQueueItem({
            userId,
            op: 'statement_update',
            payload: { id, text, originalText: original.text },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return { ...original, text }
        }

        const { api } = useAppServices()
        const updated = await api.statements.update(id, { text })
        this.statements.set(id, updated)
        if (import.meta.client && userId) {
          await upsertStatement(userId, updated)
        }
        return updated
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await upsertStatement(userId, { ...original, text })
          await addQueueItem({
            userId,
            op: 'statement_update',
            payload: { id, text, originalText: original.text },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return { ...original, text }
        }
        // Rollback on error
        this.statements.set(id, original)
        const error = err as Error
        this.error = error.message || 'Failed to update statement'
        throw error
      }
    },

    async deleteStatement(id: string): Promise<void> {
      const original = this.statements.get(id)
      if (!original) return

      // Optimistic delete
      removeStatementFromState(this, id)

      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline delete')
          await deleteStatementCache(userId, id)
          await addQueueItem({
            userId,
            op: 'statement_delete',
            payload: { id, categoryId: original.categoryId },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }

        const { api } = useAppServices()
        await api.statements.delete(id)
        if (import.meta.client && userId) {
          await deleteStatementCache(userId, id)
        }
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await deleteStatementCache(userId, id)
          await addQueueItem({
            userId,
            op: 'statement_delete',
            payload: { id, categoryId: original.categoryId },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }
        // Rollback on error
        addStatementToState(this, original)
        const error = err as Error
        this.error = error.message || 'Failed to delete statement'
        throw error
      }
    },

    updateStatement(statement: Statement) {
      addStatementToState(this, statement)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        upsertStatement(userId, statement).catch((err) => {
          console.error('Failed to cache statement:', err)
        })
      }
    },

    removeStatement(id: string) {
      removeStatementFromState(this, id)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        deleteStatementCache(userId, id).catch((err) => {
          console.error('Failed to delete statement cache:', err)
        })
      }
    },

    clearCache() {
      this.statements.clear()
      this.byCategoryId.clear()
      this.loadedCategories.clear()
    },

    setCategoryStatements(categoryId: string, statements: Statement[]) {
      setCategoryStatementsInState(this, categoryId, statements)
    },

    addStatementToCategory(statement: Statement) {
      addStatementToState(this, statement)
    },

    addStatementLocal(statement: Statement) {
      this.addStatementToCategory(statement)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        upsertStatement(userId, statement).catch((err) => {
          console.error('Failed to cache statement locally:', err)
        })
      }
    },

    async applyPendingQueue(userId: string, categoryId: string) {
      if (!import.meta.client) return
      const items = await getQueueItems(userId)
      applyPendingStatementQueue(this, items, categoryId)
    },

    async replaceStatementId(tempId: string, statement: Statement) {
      replaceStatementIdInState(this, tempId, statement)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        await replaceStatementIdCache(userId, tempId, statement)
      }
    },

    async remapCategoryId(fromCategoryId: string, toCategoryId: string) {
      remapCategoryIdInState(this, fromCategoryId, toCategoryId)

      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        await remapStatementsCategoryId(userId, fromCategoryId, toCategoryId)
      }
    },

    async removeStatementsByCategory(categoryId: string) {
      const ids = this.byCategoryId.get(categoryId)
      if (!ids) return
      for (const id of ids) {
        this.statements.delete(id)
      }
      this.byCategoryId.delete(categoryId)
      this.loadedCategories.delete(categoryId)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        await clearStatementsByCategory(userId, categoryId)
      }
    },

    getRandomFromCategory(categoryId: string): Statement | null {
      const statements = this.getByCategoryId(categoryId)
      if (statements.length === 0) return null
      const randomIndex = Math.floor(Math.random() * statements.length)
      return statements[randomIndex]
    },
  },
})
