import { defineStore } from 'pinia'
import type { Statement } from '~/types/api'
import {
  deleteStatement as deleteStatementCache,
  upsertStatement,
} from '~/utils/offlineDb'
import {
  addStatementToState,
  getStatementsByCategory,
  removeStatementFromState,
  setCategoryStatementsInState,
} from './statements/state'
import { resolveStatementsUserId, type StatementsStoreContext } from './statements/context'
import {
  applyPendingStatementsForCategory,
  fetchStatementsByCategory,
  getRandomStatementFromCategory,
  remapCategoryIdAction,
  removeStatementsByCategoryAction,
  replaceStatementIdAction,
} from './statements/readActions'
import {
  createStatementAction,
  deleteStatementAction,
  updateStatementTextAction,
} from './statements/writeActions'

interface StatementsState extends StatementsStoreContext {}

export const useStatementsStore = defineStore('statements', {
  state: (): StatementsState => ({
    statements: new Map(),
    byCategoryId: new Map(),
    isLoading: false,
    error: null,
    loadedCategories: new Set(),
  }),

  getters: {
    getById: state => (id: string) => state.statements.get(id),
    getByCategoryId: state => (categoryId: string): Statement[] =>
      getStatementsByCategory(state, categoryId),
    isCategoryLoaded: state => (categoryId: string) => state.loadedCategories.has(categoryId),
  },

  actions: {
    async fetchByCategory(categoryId: string, force = false): Promise<Statement[]> {
      return fetchStatementsByCategory(this, categoryId, force)
    },

    async createStatement(categoryId: string, text: string): Promise<Statement> {
      return createStatementAction(this, categoryId, text)
    },

    async updateStatementText(id: string, text: string): Promise<Statement> {
      return updateStatementTextAction(this, id, text)
    },

    async deleteStatement(id: string): Promise<void> {
      return deleteStatementAction(this, id)
    },

    updateStatement(statement: Statement) {
      addStatementToState(this, statement)
      const userId = resolveStatementsUserId()
      if (import.meta.client && userId) {
        upsertStatement(userId, statement).catch((err) => {
          console.error('Failed to cache statement:', err)
        })
      }
    },

    removeStatement(id: string) {
      removeStatementFromState(this, id)
      const userId = resolveStatementsUserId()
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
      const userId = resolveStatementsUserId()
      if (import.meta.client && userId) {
        upsertStatement(userId, statement).catch((err) => {
          console.error('Failed to cache statement locally:', err)
        })
      }
    },

    async applyPendingQueue(userId: string, categoryId: string) {
      await applyPendingStatementsForCategory(this, userId, categoryId)
    },

    async replaceStatementId(tempId: string, statement: Statement) {
      await replaceStatementIdAction(this, tempId, statement)
    },

    async remapCategoryId(fromCategoryId: string, toCategoryId: string) {
      await remapCategoryIdAction(this, fromCategoryId, toCategoryId)
    },

    async removeStatementsByCategory(categoryId: string) {
      await removeStatementsByCategoryAction(this, categoryId)
    },

    getRandomFromCategory(categoryId: string): Statement | null {
      return getRandomStatementFromCategory(this, categoryId)
    },
  },
})
