import type { Category, ImportCategoryRequest } from '../types/api'

function getAuthHeaders(): Record<string, string> {
  const token = import.meta.client ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const globalApi = {
  async getCategories(includeStatements = false): Promise<Category[]> {
    const query = includeStatements ? '?include_statements=true' : ''
    const response = await $fetch<Category[]>(`/api/global/categories${query}`, {
      headers: getAuthHeaders(),
    })
    return response
  },

  async getCategoryStatements(categoryId: string) {
    const response = await $fetch(`/api/global/categories/${categoryId}/statements`, {
      headers: getAuthHeaders(),
    })
    return response
  },

  async importCategory(data: ImportCategoryRequest): Promise<Category> {
    const response = await $fetch<Category>('/api/global/import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },
}

