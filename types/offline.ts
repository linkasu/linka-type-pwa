import type { Category, Statement, UserPreferences } from '~/types/api'

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
