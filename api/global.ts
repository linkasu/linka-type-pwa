import { getApiClient } from './client'
import type { Category, ImportCategoryRequest } from '~/types/api'

export const globalApi = {
  async getCategories(includeStatements = false): Promise<Category[]> {
    const client = getApiClient()
    const params = includeStatements ? { include_statements: true } : {}
    const response = await client.get<Category[]>('/global/categories', { params })
    return response.data
  },

  async getCategoryStatements(categoryId: string) {
    const client = getApiClient()
    const response = await client.get(`/global/categories/${categoryId}/statements`)
    return response.data
  },

  async importCategory(data: ImportCategoryRequest): Promise<Category> {
    const client = getApiClient()
    const response = await client.post<Category>('/global/import', data)
    return response.data
  },
}

