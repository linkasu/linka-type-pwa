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
        const { $api } = useNuxtApp()
        const categories = await $api.categories.getAll()
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
          this.categories.set(category.id, category)
          await upsertCategory(userId, category)
          await addQueueItem({
            userId,
            op: 'category_create',
            payload: { category },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return category
        }

        const { $api } = useNuxtApp()
        const category = await $api.categories.create({ label, created: Date.now(), aiUse })
        const normalized = { ...category, aiUse: category.aiUse ?? aiUse ?? false }
        this.categories.set(normalized.id, normalized)
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
          this.categories.set(category.id, category)
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

        const { $api } = useNuxtApp()
        const updated = await $api.categories.update(id, { label, aiUse })
        const normalized = { ...updated, aiUse: updated.aiUse ?? false }
        this.categories.set(id, normalized)
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
      this.categories.delete(id)
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

        const { $api } = useNuxtApp()
        await $api.categories.delete(id)
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
          this.categories.set(id, original)
        }
        const error = err as Error
        this.error = error.message || 'Failed to delete category'
        throw error
      }
    },

    updateCategory(category: Category) {
      const normalized = { ...category, aiUse: category.aiUse ?? false }
      this.categories.set(category.id, normalized)
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        upsertCategory(userId, normalized).catch((err) => {
          console.error('Failed to cache category:', err)
        })
      }
    },

    removeCategory(id: string) {
      this.categories.delete(id)
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
      this.categories.clear()
      for (const category of categories) {
        this.categories.set(category.id, { ...category, aiUse: category.aiUse ?? false })
      }
    },

    async applyPendingQueue(userId: string) {
      if (!import.meta.client) return
      const items = await getQueueItems(userId)
      for (const item of items) {
        switch (item.op) {
          case 'category_create': {
            const payload = item.payload as { category: Category }
            if (!this.categories.has(payload.category.id)) {
              this.categories.set(payload.category.id, payload.category)
            }
            break
          }
          case 'category_update': {
            const payload = item.payload as { id: string; label: string; aiUse?: boolean }
            const existing = this.categories.get(payload.id)
            if (existing) {
              this.categories.set(payload.id, {
                ...existing,
                label: payload.label,
                aiUse: payload.aiUse ?? existing.aiUse ?? false,
              })
            }
            break
          }
          case 'category_delete': {
            const payload = item.payload as { id: string }
            this.categories.delete(payload.id)
            break
          }
          default:
            break
        }
      }
    },

    async replaceCategoryId(tempId: string, category: Category) {
      this.categories.delete(tempId)
      this.categories.set(category.id, { ...category, aiUse: category.aiUse ?? false })
      const userId = resolveLocalUserId()
      if (import.meta.client && userId) {
        await replaceCategoryIdCache(userId, tempId, category)
      }
    },
  },
})
