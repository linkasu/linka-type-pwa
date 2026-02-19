import { defineStore } from 'pinia'
import type { Category } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { useAuthStore } from '~/stores/auth'
import { generateTempId, isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  addQueueItem,
  deleteCategory as deleteCategoryCache,
  getCategories as getCachedCategories,
  getQueueItems,
  replaceCategories,
  replaceCategoryId as replaceCategoryIdCache,
  upsertCategory,
} from '~/utils/offlineDb'
import {
  getSortedCategories,
  removeCategoryFromState,
  replaceCategoryIdInState,
  setCategoriesFromList,
  setCategoryInState,
} from './categories/state'
import { applyPendingCategoryQueue } from './categories/queue'

interface CategoriesState {
  categories: Map<string, Category>
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const resolveLocalUserId = (): string | null => {
  const authStore = useAuthStore()
  return authStore.user?.id || authStore.deviceId || null
}

export const useCategoriesStore = defineStore('categories', {
  state: (): CategoriesState => ({
    categories: new Map(),
    isLoading: false,
    error: null,
    lastFetchTime: null,
  }),

  getters: {
    sortedCategories: (state) => getSortedCategories(state),

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
      const userId = resolveLocalUserId()

      let cached: Category[] = []
      if (import.meta.client && userId) {
        cached = await getCachedCategories(userId)
        if (cached.length > 0) {
          this.setFromList(cached)
        }
      }

      if (isOffline()) {
        this.isLoading = false
        return
      }

      try {
        const { api } = useAppServices()
        const categories = await api.categories.getAll()
        this.setFromList(categories)
        this.lastFetchTime = Date.now()
        if (import.meta.client && userId) {
          await this.applyPendingQueue(userId)
          await replaceCategories(userId, Array.from(this.categories.values()))
        }
      } catch (err: unknown) {
        if (!shouldQueueOffline(err)) {
          const error = err as Error
          this.error = error.message || 'Failed to fetch categories'
          throw error
        }
      } finally {
        this.isLoading = false
      }
    },

    async createCategory(label: string, aiUse = false): Promise<Category> {
      this.error = null
      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline create')
          const category: Category = {
            id: generateTempId('cat'),
            label,
            created: Date.now(),
            default: false,
            aiUse,
          }
          setCategoryInState(this, category)
          await upsertCategory(userId, category)
          await addQueueItem({
            userId,
            op: 'category_create',
            payload: { category },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return category
        }

        const { api } = useAppServices()
        const category = await api.categories.create({ label, created: Date.now(), aiUse })
        const normalized = setCategoryInState(this, {
          ...category,
          aiUse: category.aiUse ?? aiUse ?? false,
        })
        if (import.meta.client && userId) {
          await upsertCategory(userId, normalized)
        }
        return normalized
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          const category: Category = {
            id: generateTempId('cat'),
            label,
            created: Date.now(),
            default: false,
            aiUse,
          }
          setCategoryInState(this, category)
          await upsertCategory(userId, category)
          await addQueueItem({
            userId,
            op: 'category_create',
            payload: { category },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return category
        }
        const error = err as Error
        this.error = error.message || 'Failed to create category'
        throw error
      }
    },

    async updateCategoryLabel(id: string, label: string, aiUse?: boolean): Promise<Category> {
      const original = this.categories.get(id)
      if (!original) throw new Error('Category not found')
      const updatedCategory: Category = {
        ...original,
        label,
        aiUse: aiUse ?? original.aiUse ?? false,
      }

      // Optimistic update
      this.categories.set(id, updatedCategory)

      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline update')
          await upsertCategory(userId, updatedCategory)
          await addQueueItem({
            userId,
            op: 'category_update',
            payload: { id, label, aiUse, originalLabel: original.label, originalAiUse: original.aiUse },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return updatedCategory
        }

        const { api } = useAppServices()
        const updated = await api.categories.update(id, { label, aiUse })
        const normalized = setCategoryInState(this, {
          ...updated,
          aiUse: updated.aiUse ?? false,
        })
        if (import.meta.client && userId) {
          await upsertCategory(userId, normalized)
        }
        return normalized
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await upsertCategory(userId, updatedCategory)
          await addQueueItem({
            userId,
            op: 'category_update',
            payload: { id, label, aiUse, originalLabel: original.label, originalAiUse: original.aiUse },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return updatedCategory
        }
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
      removeCategoryFromState(this, id)
      const userId = resolveLocalUserId()

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline delete')
          await deleteCategoryCache(userId, id)
          await addQueueItem({
            userId,
            op: 'category_delete',
            payload: { id },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }

        const { api } = useAppServices()
        await api.categories.delete(id)
        if (import.meta.client && userId) {
          await deleteCategoryCache(userId, id)
        }
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await deleteCategoryCache(userId, id)
          await addQueueItem({
            userId,
            op: 'category_delete',
            payload: { id },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return
        }
        // Rollback on error
        if (original) {
          setCategoryInState(this, original)
        }
        const error = err as Error
        this.error = error.message || 'Failed to delete category'
        throw error
      }
    },

    updateCategory(category: Category) {
      const normalized = setCategoryInState(this, category)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        upsertCategory(userId, normalized).catch((err) => {
          console.error('Failed to cache category:', err)
        })
      }
    },

    removeCategory(id: string) {
      removeCategoryFromState(this, id)
      const userId = resolveLocalUserId()
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
      if (!import.meta.client) return
      const items = await getQueueItems(userId)
      applyPendingCategoryQueue(this, items)
    },

    async replaceCategoryId(tempId: string, category: Category) {
      replaceCategoryIdInState(this, tempId, category)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        await replaceCategoryIdCache(userId, tempId, category)
      }
    },
  },
})
