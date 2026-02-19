import type { Statement } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

export interface StatementsStoreContext {
  statements: Map<string, Statement>
  byCategoryId: Map<string, Set<string>>
  loadedCategories: Set<string>
  isLoading: boolean
  error: string | null
}

export const resolveStatementsUserId = (): string | null => {
  const authStore = useAuthStore()
  return authStore.user?.id || authStore.deviceId || null
}
