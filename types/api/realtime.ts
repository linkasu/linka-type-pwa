import type {
  Category,
  QuickPhrase,
  Statement,
  UserState,
} from './entities'

export type ChangeType =
  | 'category_added'
  | 'category_updated'
  | 'category_deleted'
  | 'statement_added'
  | 'statement_updated'
  | 'statement_deleted'
  | 'quickes_updated'
  | 'user_state_updated'

export type ErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'validation_error'
  | 'conflict'
  | 'internal_error'

export interface RealtimeChange {
  type: ChangeType
  data: Category | Statement | QuickPhrase | UserState
  timestamp: number
}

export interface ChangesResponse {
  type: 'changes'
  cursor: string
  changes: RealtimeChange[]
}

export interface ApiError {
  error: {
    code: ErrorCode
    message: string
  }
}
