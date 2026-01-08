import { getApiClient } from './client'
import { normalizeStatement, normalizeStatements } from './normalize'
import type { Statement, CreateStatementRequest, UpdateStatementRequest } from '~/types/api'

export const statementsApi = {
  async getByCategory(categoryId: string): Promise<Statement[]> {
    const client = getApiClient()
    const response = await client.get<Statement[]>(`/categories/${categoryId}/statements`)
    return normalizeStatements(response.data as Statement[])
  },

  async getById(id: string): Promise<Statement> {
    const client = getApiClient()
    const response = await client.get<Statement>(`/statements/${id}`)
    return normalizeStatement(response.data as Statement)
  },

  async create(data: CreateStatementRequest): Promise<Statement> {
    const client = getApiClient()
    const response = await client.post('/statements', data)
    const payload = (response.data as { statement?: Statement }).statement ?? response.data
    return normalizeStatement(payload as Statement)
  },

  async update(id: string, data: UpdateStatementRequest): Promise<Statement> {
    const client = getApiClient()
    const response = await client.patch<Statement>(`/statements/${id}`, data)
    return normalizeStatement(response.data as Statement)
  },

  async delete(id: string): Promise<void> {
    const client = getApiClient()
    await client.delete(`/statements/${id}`)
  },
}
