import type { Statement, CreateStatementRequest, UpdateStatementRequest } from '../types/api'

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

export const statementsApi = {
  async getByCategory(categoryId: string): Promise<Statement[]> {
    const response = await $fetch<Statement[]>(`/api/categories/${categoryId}/statements`, {
      headers: getAuthHeaders(),
    })
    return response
  },

  async getById(id: string): Promise<Statement> {
    const response = await $fetch<Statement>(`/api/statements/${id}`, {
      headers: getAuthHeaders(),
    })
    return response
  },

  async create(data: CreateStatementRequest): Promise<Statement> {
    const response = await $fetch<Statement>('/api/statements', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },

  async update(id: string, data: UpdateStatementRequest): Promise<Statement> {
    const response = await $fetch<Statement>(`/api/statements/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/statements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },
}

