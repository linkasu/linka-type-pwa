import { defineStore } from 'pinia'
import type { Statement } from '../types/api'

interface StatementsState {
  statements: Map<string, Statement>
  byCategoryId: Map<string, Set<string>>
  isLoading: boolean
  error: string | null
  loadedCategories: Set<string>
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

    getByCategoryId: (state) => (categoryId: string): Statement[] => {
      const ids = state.byCategoryId.get(categoryId)
      if (!ids) return []
      
      const statements: Statement[] = []
      for (const id of ids) {
        const stmt = state.statements.get(id)
        if (stmt) statements.push(stmt)
      }
      return statements.sort((a, b) => a.created - b.created)
    },

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

      try {
        const { $api } = useNuxtApp()
        const statements = await $api.statements.getByCategory(categoryId)
        
        // Clear existing statements for this category
        const existingIds = this.byCategoryId.get(categoryId)
        if (existingIds) {
          for (const id of existingIds) {
            this.statements.delete(id)
          }
        }

        // Add new statements
        const newIds = new Set<string>()
        for (const stmt of statements) {
          this.statements.set(stmt.id, stmt)
          newIds.add(stmt.id)
        }
        this.byCategoryId.set(categoryId, newIds)
        this.loadedCategories.add(categoryId)

        return statements
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to fetch statements'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createStatement(categoryId: string, text: string): Promise<Statement> {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const statement = await $api.statements.create({ categoryId, text, created: Date.now() })
        
        this.statements.set(statement.id, statement)
        
        let categoryIds = this.byCategoryId.get(categoryId)
        if (!categoryIds) {
          categoryIds = new Set()
          this.byCategoryId.set(categoryId, categoryIds)
        }
        categoryIds.add(statement.id)

        return statement
      } catch (err: unknown) {
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

      try {
        const { $api } = useNuxtApp()
        const updated = await $api.statements.update(id, { text })
        this.statements.set(id, updated)
        return updated
      } catch (err: unknown) {
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
      this.statements.delete(id)
      const categoryIds = this.byCategoryId.get(original.categoryId)
      categoryIds?.delete(id)

      try {
        const { $api } = useNuxtApp()
        await $api.statements.delete(id)
      } catch (err: unknown) {
        // Rollback on error
        this.statements.set(id, original)
        categoryIds?.add(id)
        const error = err as Error
        this.error = error.message || 'Failed to delete statement'
        throw error
      }
    },

    updateStatement(statement: Statement) {
      this.statements.set(statement.id, statement)
      
      let categoryIds = this.byCategoryId.get(statement.categoryId)
      if (!categoryIds) {
        categoryIds = new Set()
        this.byCategoryId.set(statement.categoryId, categoryIds)
      }
      categoryIds.add(statement.id)
    },

    removeStatement(id: string) {
      const stmt = this.statements.get(id)
      if (stmt) {
        this.byCategoryId.get(stmt.categoryId)?.delete(id)
      }
      this.statements.delete(id)
    },

    clearCache() {
      this.statements.clear()
      this.byCategoryId.clear()
      this.loadedCategories.clear()
    },

    getRandomFromCategory(categoryId: string): Statement | null {
      const statements = this.getByCategoryId(categoryId)
      if (statements.length === 0) return null
      const randomIndex = Math.floor(Math.random() * statements.length)
      return statements[randomIndex]
    },
  },
})

