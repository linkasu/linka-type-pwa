import { getApiClient } from './client'
import { normalizeCategory, normalizeStatements } from './normalize'
import type { GlobalCategory, ImportCategoryRequest, Statement } from '~/types/api'

export const globalApi = {
  async getCategories(includeStatements = false): Promise<GlobalCategory[]> {
    const client = getApiClient()
    const params = includeStatements ? { include_statements: true } : {}
    const response = await client.get<GlobalCategory[]>('/global/categories', { params })
    return response.data.map((category) => {
      const statements = category.statements ? normalizeStatements(category.statements) : undefined
      const normalized = normalizeCategory(category)
      return {
        ...normalized,
        statements,
        statementsCount: normalized.statementsCount ?? statements?.length,
      }
    })
  },

  async getCategoryStatements(categoryId: string): Promise<Statement[]> {
    const client = getApiClient()
    const response = await client.get<Statement[]>(`/global/categories/${categoryId}/statements`)
    return normalizeStatements(response.data)
  },

  async importCategory(data: ImportCategoryRequest): Promise<GlobalCategory> {
    const client = getApiClient()
    const payload = {
      category_id: data.categoryId,
      force: data.force,
    }
    const response = await client.post<GlobalCategory>('/global/import', payload)
    return normalizeCategory(response.data)
  },
}
