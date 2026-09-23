import type { Statement } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import {
  addStatementToState,
  removeStatementFromState,
  type StatementsCollections,
  setCategoryStatementsInState,
} from './state'
import type { StatementReplacePayload } from '~/types/offline'

type StatementCreatePayload = { statement: Statement }
type StatementUpdatePayload = { id: string; text: string }
type StatementDeletePayload = { id: string }

export const applyPendingStatementQueue = (
  state: StatementsCollections,
  items: OfflineQueueItem[],
  categoryId: string,
) => {
  for (const item of items) {
    switch (item.op) {
      case 'statement_create': {
        const payload = item.payload as StatementCreatePayload
        if (payload.statement.categoryId === categoryId) {
          addStatementToState(state, payload.statement)
        }
        break
      }
      case 'statement_update': {
        const payload = item.payload as StatementUpdatePayload
        const existing = state.statements.get(payload.id)
        if (existing && existing.categoryId === categoryId) {
          state.statements.set(payload.id, { ...existing, text: payload.text })
        }
        break
      }
      case 'statement_delete': {
        const payload = item.payload as StatementDeletePayload
        const existing = state.statements.get(payload.id)
        if (existing && existing.categoryId === categoryId) {
          removeStatementFromState(state, payload.id)
        }
        break
      }
      case 'statement_replace': {
        const payload = item.payload as StatementReplacePayload
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
