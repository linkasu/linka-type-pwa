import type { Category, Statement } from '~/types/api'
import type {
  CategoryUpdatePayload,
  StatementUpdatePayload,
  SyncConflict,
} from '~/types/offline'
import type { AppApi } from '~/src/renderer/app-context'

type CategoriesStoreLike = {
  replaceCategoryId: (fromId: string, category: Category) => Promise<void>
  updateCategory: (category: Category) => Promise<void> | void
  removeCategory: (id: string) => void
}

type StatementsStoreLike = {
  getById: (id: string) => Statement | undefined
  replaceStatementId: (fromId: string, statement: Statement) => Promise<void>
  updateStatement: (statement: Statement) => Promise<void> | void
  removeStatement: (id: string) => void
}

type ConflictResolutionDeps = {
  api: AppApi
  categoriesStore: CategoriesStoreLike
  statementsStore: StatementsStoreLike
}

export const resolveSyncConflict = async (
  conflict: SyncConflict,
  resolution: 'local' | 'remote',
  deps: ConflictResolutionDeps,
): Promise<void> => {
  const { api, categoriesStore, statementsStore } = deps

  if (resolution === 'local') {
    if (conflict.entityType === 'category') {
      if (conflict.conflictType === 'update_delete') {
        const payload = conflict.localChange.payload as CategoryUpdatePayload
        const created = await api.categories.create({ label: payload.label, aiUse: payload.aiUse })
        await categoriesStore.replaceCategoryId(conflict.entityId, created)
      } else {
        const payload = conflict.localChange.payload as CategoryUpdatePayload
        const updated = await api.categories.update(conflict.entityId, {
          label: payload.label,
          aiUse: payload.aiUse,
        })
        await categoriesStore.updateCategory(updated)
      }
    } else if (conflict.entityType === 'statement') {
      if (conflict.conflictType === 'update_delete') {
        const payload = conflict.localChange.payload as StatementUpdatePayload
        const original = statementsStore.getById(conflict.entityId)
        if (original) {
          const created = await api.statements.create({
            categoryId: original.categoryId,
            text: payload.text,
          })
          await statementsStore.replaceStatementId(conflict.entityId, created)
        }
      } else {
        const payload = conflict.localChange.payload as StatementUpdatePayload
        const updated = await api.statements.update(conflict.entityId, { text: payload.text })
        await statementsStore.updateStatement(updated)
      }
    }

    return
  }

  if (conflict.entityType === 'category') {
    if (conflict.conflictType === 'update_delete') {
      categoriesStore.removeCategory(conflict.entityId)
    } else if (conflict.remoteData) {
      categoriesStore.updateCategory(conflict.remoteData as Category)
    }
    return
  }

  if (conflict.entityType === 'statement') {
    if (conflict.conflictType === 'update_delete') {
      statementsStore.removeStatement(conflict.entityId)
    } else if (conflict.remoteData) {
      statementsStore.updateStatement(conflict.remoteData as Statement)
    }
  }
}
