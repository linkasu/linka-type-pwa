import type { Category, Statement, UserPreferences } from '~/types/api'

export type { Category, Statement }

export type OfflineOperation =
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'statement_create'
  | 'statement_update'
  | 'statement_delete'
  | 'quickes_update'
  | 'user_prefs_update'

export interface CategoryCreatePayload {
  category: Category
}

export interface CategoryUpdatePayload {
  id: string
  label: string
  aiUse?: boolean
}

export interface CategoryDeletePayload {
  id: string
}

export interface StatementCreatePayload {
  statement: Statement
}

export interface StatementUpdatePayload {
  id: string
  text: string
}

export interface StatementDeletePayload {
  id: string
  categoryId?: string
}

export interface QuickesUpdatePayload {
  quickes: string[]
}

export interface UserPrefsUpdatePayload {
  preferences: Partial<UserPreferences>
}

export type OfflinePayload =
  | CategoryCreatePayload
  | CategoryUpdatePayload
  | CategoryDeletePayload
  | StatementCreatePayload
  | StatementUpdatePayload
  | StatementDeletePayload
  | QuickesUpdatePayload
  | UserPrefsUpdatePayload

export interface OfflineQueueItem {
  id?: number
  userId: string
  op: OfflineOperation
  payload: OfflinePayload
  createdAt: number
}

// Conflict resolution types
export type ConflictType =
  | 'update_update'  // Both local and remote modified the same entity
  | 'update_delete'  // Locally modified, deleted on server
  | 'delete_update'  // Locally deleted, modified on server

export interface SyncConflict {
  id: string
  entityType: 'category' | 'statement'
  entityId: string
  conflictType: ConflictType
  localChange: OfflineQueueItem
  remoteData?: Category | Statement
  localData?: Category | Statement
  createdAt: number
}

// Extended payload types with original values for conflict detection
export interface CategoryUpdatePayloadWithOriginal extends CategoryUpdatePayload {
  originalLabel?: string
  originalAiUse?: boolean
}

export interface StatementUpdatePayloadWithOriginal extends StatementUpdatePayload {
  originalText?: string
}
