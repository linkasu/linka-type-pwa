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
      const authStore = useAuthStore()
      const userId = authStore.user?.id

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
        if (!cached.length || !shouldQueueOffline(err)) {
          const error = err as Error
          this.error = error.message || 'Failed to fetch categories'
          throw error
        }
      } finally {
        this.isLoading = false
      }
    },

    async createCategory(label: string): Promise<Category> {
      this.error = null
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline create')
          const category: Category = {
            id: generateTempId('cat'),
            label,
            created: Date.now(),
            default: false,
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
        const category = await $api.categories.create({ label, created: Date.now() })
        this.categories.set(category.id, category)
        if (import.meta.client && userId) {
          await upsertCategory(userId, category)
        }
        return category
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          const category: Category = {
            id: generateTempId('cat'),
            label,
            created: Date.now(),
            default: false,
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

    async updateCategoryLabel(id: string, label: string): Promise<Category> {
      const original = this.categories.get(id)
      if (!original) throw new Error('Category not found')

      // Optimistic update
      this.categories.set(id, { ...original, label })

      const authStore = useAuthStore()
      const userId = authStore.user?.id

      try {
        if (isOffline()) {
          if (!userId) throw new Error('Missing user for offline update')
          await upsertCategory(userId, { ...original, label })
          await addQueueItem({
            userId,
            op: 'category_update',
            payload: { id, label },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return { ...original, label }
        }

        const { $api } = useNuxtApp()
        const updated = await $api.categories.update(id, { label })
        this.categories.set(id, updated)
        if (import.meta.client && userId) {
          await upsertCategory(userId, updated)
        }
        return updated
      } catch (err: unknown) {
        if (shouldQueueOffline(err) && userId) {
          await upsertCategory(userId, { ...original, label })
          await addQueueItem({
            userId,
            op: 'category_update',
            payload: { id, label },
            createdAt: Date.now(),
          } satisfies OfflineQueueItem)
          return { ...original, label }
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
      const authStore = useAuthStore()
      const userId = authStore.user?.id

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
      this.categories.set(category.id, category)
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        void upsertCategory(userId, category)
      }
    },

    removeCategory(id: string) {
      this.categories.delete(id)
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        void deleteCategoryCache(userId, id)
      }
    },

    clearCache() {
      this.categories.clear()
      this.lastFetchTime = null
    },

    setFromList(categories: Category[]) {
      this.categories.clear()
      for (const category of categories) {
        this.categories.set(category.id, category)
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
            const payload = item.payload as { id: string; label: string }
            const existing = this.categories.get(payload.id)
            if (existing) {
              this.categories.set(payload.id, { ...existing, label: payload.label })
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
      this.categories.set(category.id, category)
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (import.meta.client && userId) {
        await replaceCategoryIdCache(userId, tempId, category)
      }
    },
  },
})

