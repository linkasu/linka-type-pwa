import type { Category } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

export interface CategoriesStoreContext {
  categories: Map<string, Category>
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
}

export const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000

export const resolveCategoriesUserId = (): string | null => {
  const authStore = useAuthStore()
  return authStore.user?.id || authStore.deviceId || null
}
