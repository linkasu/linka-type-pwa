import type { Category, Statement } from '~/types/api'
import type {
  OfflineQueueItem,
  SyncConflict,
  UserPrefsUpdatePayload,
} from '~/types/offline'

export type QueueItemResult = 'processed' | 'deferred'

export interface QueueApi {
  categories: {
    create: (payload: { label: string; created?: number; aiUse?: boolean }) => Promise<Category>
    update: (id: string, payload: { label: string; aiUse?: boolean }) => Promise<Category>
    delete: (id: string) => Promise<void>
    getById: (id: string) => Promise<Category>
  }
  statements: {
    create: (payload: { categoryId: string; text: string; created?: number }) => Promise<Statement>
    update: (id: string, payload: { text: string }) => Promise<Statement>
    delete: (id: string) => Promise<void>
    getById: (id: string) => Promise<Statement>
  }
  quickes: {
    update: (payload: { quickes: string[] }) => Promise<void>
  }
  user: {
    updateState: (payload: { preferences?: UserPrefsUpdatePayload['preferences'] }) => Promise<void>
  }
}

export interface QueueStores {
  categoriesStore: {
    replaceCategoryId: (tempId: string, category: Category) => Promise<void>
    updateCategory: (category: Category) => void
    removeCategory: (id: string) => void
  }
  statementsStore: {
    remapCategoryId: (fromCategoryId: string, toCategoryId: string) => Promise<void>
    removeStatementsByCategory: (categoryId: string) => Promise<void>
    replaceStatementId: (tempId: string, statement: Statement) => Promise<void>
    updateStatement: (statement: Statement) => void
    removeStatement: (id: string) => void
  }
  quickesStore: {
    setQuickes: (quickes: string[]) => void
  }
  settingsStore: {
    applySettingsPatch: (patch: Record<string, unknown>) => void
  }
  userStore: {
    applyPreferencesPatch: (patch: Record<string, unknown>) => void
  }
}

export interface QueueFlushContext {
  api: QueueApi
  stores: QueueStores
  items: OfflineQueueItem[]
  index: number
  item: OfflineQueueItem
  idMap: Map<string, string>
  conflicts: SyncConflict[]
}
