import type { OfflineQueueItem } from '~/types/offline'
import {
  addStatementToState,
  removeStatementFromState,
  type StatementsCollections,
  setCategoryStatementsInState,
} from './state'
export const applyPendingStatementQueue = (
  state: StatementsCollections,
  items: OfflineQueueItem[],
  categoryId: string,
) => {
  for (const item of items) {
    switch (item.op) {
      case 'statement_create': {
        const payload = item.payload
        if (payload.statement.categoryId === categoryId) {
          addStatementToState(state, payload.statement)
        }
        break
      }
      case 'statement_update': {
        const payload = item.payload
        const existing = state.statements.get(payload.id)
        if (existing && existing.categoryId === categoryId) {
          state.statements.set(payload.id, { ...existing, text: payload.text })
        }
        break
      }
      case 'statement_delete': {
        const payload = item.payload
        const existing = state.statements.get(payload.id)
        if (existing && existing.categoryId === categoryId) {
          removeStatementFromState(state, payload.id)
        }
        break
      }
      case 'statement_replace': {
        const payload = item.payload
        if (payload.categoryId === categoryId) {
          setCategoryStatementsInState(state, categoryId, payload.drafts)
        }
        break
      }
      default:
        break
    }
  }
}
