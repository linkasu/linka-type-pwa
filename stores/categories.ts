import { defineStore } from 'pinia'
import type { Category } from '~/types/api'
import {
  deleteCategory as deleteCategoryCache,
  upsertCategory,
} from '~/utils/offlineDb'
import {
  getSortedCategories,
  removeCategoryFromState,
  setCategoriesFromList,
  setCategoryInState,
} from './categories/state'
import { resolveCategoriesUserId, type CategoriesStoreContext } from './categories/context'
import {
  applyPendingCategories,
  fetchCategoriesAction,
  isCategoriesCacheValid,
  replaceCategoryIdAction,
} from './categories/readActions'
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryLabelAction,
} from './categories/writeActions'

interface CategoriesState extends CategoriesStoreContext {}

export const useCategoriesStore = defineStore('categories', {
  state: (): CategoriesState => ({
    categories: new Map(),
    isLoading: false,
    error: null,
    lastFetchTime: null,
  }),

  getters: {
    sortedCategories: state => getSortedCategories(state),
    getById: state => (id: string) => state.categories.get(id),
    isCacheValid: state => isCategoriesCacheValid(state),
  },

  actions: {
    async fetchCategories(force = false) {
      await fetchCategoriesAction(this, force)
    },

    async createCategory(label: string, aiUse = false): Promise<Category> {
      return createCategoryAction(this, label, aiUse)
    },

    async updateCategoryLabel(id: string, label: string, aiUse?: boolean): Promise<Category> {
      return updateCategoryLabelAction(this, id, label, aiUse)
    },

    async deleteCategory(id: string): Promise<void> {
      await deleteCategoryAction(this, id)
    },

    updateCategory(category: Category) {
      const normalized = setCategoryInState(this, category)
      const userId = resolveCategoriesUserId()
      if (import.meta.client && userId) {
        upsertCategory(userId, normalized).catch((err) => {
          console.error('Failed to cache category:', err)
        })
      }
    },

    removeCategory(id: string) {
      removeCategoryFromState(this, id)
      const userId = resolveCategoriesUserId()
      if (import.meta.client && userId) {
        deleteCategoryCache(userId, id).catch((err) => {
          console.error('Failed to delete category cache:', err)
        })
      }
    },

    clearCache() {
      this.categories.clear()
      this.lastFetchTime = null
    },

    setFromList(categories: Category[]) {
      setCategoriesFromList(this, categories)
    },

    async applyPendingQueue(userId: string) {
      await applyPendingCategories(this, userId)
    },

    async replaceCategoryId(tempId: string, category: Category) {
      await replaceCategoryIdAction(this, tempId, category)
    },
  },
})
