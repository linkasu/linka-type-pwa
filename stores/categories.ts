import { defineStore } from 'pinia'
import type { Category } from '~/types/api'

interface CategoriesState {
  categories: Map<string, Category>
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useCategoriesStore = defineStore('categories', {
  state: (): CategoriesState => ({
    categories: new Map(),
    isLoading: false,
    error: null,
    lastFetchTime: null,
  }),

  getters: {
    sortedCategories: (state) => {
      const cats = Array.from(state.categories.values())
      return cats.sort((a, b) => {
        if (a.default && !b.default) return -1
        if (!a.default && b.default) return 1
        return a.created - b.created
      })
    },

    getById: (state) => (id: string) => state.categories.get(id),

    isCacheValid: (state) => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < CACHE_TTL
    },
  },

  actions: {
    async fetchCategories(force = false) {
      if (!force && this.isCacheValid) return

      this.isLoading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const categories = await $api.categories.getAll()
        
        this.categories.clear()
        for (const cat of categories) {
          this.categories.set(cat.id, cat)
        }
        this.lastFetchTime = Date.now()
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to fetch categories'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createCategory(label: string): Promise<Category> {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const category = await $api.categories.create({ label, created: Date.now() })
        this.categories.set(category.id, category)
        return category
      } catch (err: unknown) {
        const error = err as Error
        this.error = error.message || 'Failed to create category'
        throw error
      }
    },

    async updateCategoryLabel(id: string, label: string): Promise<Category> {
      const original = this.categories.get(id)
      if (!original) throw new Error('Category not found')

      // Optimistic update
      this.categories.set(id, { ...original, label })

      try {
        const { $api } = useNuxtApp()
        const updated = await $api.categories.update(id, { label })
        this.categories.set(id, updated)
        return updated
      } catch (err: unknown) {
        // Rollback on error
        this.categories.set(id, original)
        const error = err as Error
        this.error = error.message || 'Failed to update category'
        throw error
      }
    },

    async deleteCategory(id: string): Promise<void> {
      const original = this.categories.get(id)
      
      // Optimistic delete
      this.categories.delete(id)

      try {
        const { $api } = useNuxtApp()
        await $api.categories.delete(id)
      } catch (err: unknown) {
        // Rollback on error
        if (original) {
          this.categories.set(id, original)
        }
        const error = err as Error
        this.error = error.message || 'Failed to delete category'
        throw error
      }
    },

    updateCategory(category: Category) {
      this.categories.set(category.id, category)
    },

    removeCategory(id: string) {
      this.categories.delete(id)
    },

    clearCache() {
      this.categories.clear()
      this.lastFetchTime = null
    },
  },
})

