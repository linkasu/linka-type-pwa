import type { Statement } from '~/types/api'

export interface StatementsCollections {
  statements: Map<string, Statement>
  byCategoryId: Map<string, Set<string>>
}

const ensureCategoryIds = (state: StatementsCollections, categoryId: string) => {
  let categoryIds = state.byCategoryId.get(categoryId)
  if (!categoryIds) {
    categoryIds = new Set<string>()
    state.byCategoryId.set(categoryId, categoryIds)
  }
  return categoryIds
}

export const getStatementsByCategory = (
  state: StatementsCollections,
  categoryId: string,
): Statement[] => {
  const ids = state.byCategoryId.get(categoryId)
  if (!ids) return []

  const statements: Statement[] = []
  for (const id of ids) {
    const statement = state.statements.get(id)
    if (statement) statements.push(statement)
  }

  return statements.sort((a, b) => a.created - b.created)
}

export const addStatementToState = (
  state: StatementsCollections,
  statement: Statement,
) => {
  state.statements.set(statement.id, statement)
  ensureCategoryIds(state, statement.categoryId).add(statement.id)
}

export const removeStatementFromState = (
  state: StatementsCollections,
  id: string,
): Statement | null => {
  const statement = state.statements.get(id)
  if (!statement) return null

  state.byCategoryId.get(statement.categoryId)?.delete(id)
  state.statements.delete(id)
  return statement
}

export const setCategoryStatementsInState = (
  state: StatementsCollections,
  categoryId: string,
  statements: Statement[],
) => {
  const existingIds = state.byCategoryId.get(categoryId)
  if (existingIds) {
    for (const id of existingIds) {
      state.statements.delete(id)
    }
  }

  const newIds = new Set<string>()
  for (const statement of statements) {
    state.statements.set(statement.id, statement)
    newIds.add(statement.id)
  }

  state.byCategoryId.set(categoryId, newIds)
}

export const replaceStatementIdInState = (
  state: StatementsCollections,
  tempId: string,
  statement: Statement,
) => {
  removeStatementFromState(state, tempId)
  addStatementToState(state, statement)
}

export const remapCategoryIdInState = (
  state: StatementsCollections,
  fromCategoryId: string,
  toCategoryId: string,
) => {
  const ids = state.byCategoryId.get(fromCategoryId)
  if (!ids) return

  const targetIds = ensureCategoryIds(state, toCategoryId)
  for (const id of ids) {
    targetIds.add(id)
    const statement = state.statements.get(id)
    if (statement) {
      state.statements.set(id, { ...statement, categoryId: toCategoryId })
    }
  }

  state.byCategoryId.delete(fromCategoryId)
}
