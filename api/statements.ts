import { getApiClient } from './client'
import type { Statement, CreateStatementRequest, UpdateStatementRequest } from '~/types/api'

export const statementsApi = {
  async getByCategory(categoryId: string): Promise<Statement[]> {
    const client = getApiClient()
    const response = await client.get<Statement[]>(`/categories/${categoryId}/statements`)
    return response.data
  },

  async getById(id: string): Promise<Statement> {
    const client = getApiClient()
    const response = await client.get<Statement>(`/statements/${id}`)
    return response.data
  },

  async create(data: CreateStatementRequest): Promise<Statement> {
    const client = getApiClient()
    const response = await client.post<Statement>('/statements', data)
    return response.data
  },

  async update(id: string, data: UpdateStatementRequest): Promise<Statement> {
    const client = getApiClient()
    const response = await client.patch<Statement>(`/statements/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    const client = getApiClient()
    await client.delete(`/statements/${id}`)
  },
}

