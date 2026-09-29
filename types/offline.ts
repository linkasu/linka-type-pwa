import type { Category, Statement, UserPreferences } from '~/types/api'

export type { Category, Statement }

export type OfflineOperation =
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'statement_create'
  | 'statement_update'
  | 'statement_delete'
  | 'statement_replace'
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

export interface StatementReplacePayload {
  categoryId: string
  text: string
  drafts: Statement[]
}

export interface QuickesUpdatePayload {
  quickes: string[]
}

export interface UserPrefsUpdatePayload {
  preferences: Partial<UserPreferences>
}

interface OfflineQueueItemBase {
  id?: number
  userId: string
  createdAt: number
}

// `op` already persists with every record, so this adds compile-time narrowing only.
export type OfflineQueueItem = OfflineQueueItemBase & (
  | { op: 'category_create'; payload: CategoryCreatePayload }
  | { op: 'category_update'; payload: CategoryUpdatePayloadWithOriginal }
  | { op: 'category_delete'; payload: CategoryDeletePayload }
  | { op: 'statement_create'; payload: StatementCreatePayload }
  | { op: 'statement_update'; payload: StatementUpdatePayloadWithOriginal }
  | { op: 'statement_delete'; payload: StatementDeletePayload }
  | { op: 'statement_replace'; payload: StatementReplacePayload }
  | { op: 'quickes_update'; payload: QuickesUpdatePayload }
  | { op: 'user_prefs_update'; payload: UserPrefsUpdatePayload }
)

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
