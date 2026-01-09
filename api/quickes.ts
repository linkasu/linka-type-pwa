import { getApiClient } from './client'
import type { UpdateQuickesRequest } from '~/types/api'

export const quickesApi = {
  async get(): Promise<string[]> {
    const client = getApiClient()
    const response = await client.get<string[]>('/quickes')
    return response.data
  },

  async update(data: UpdateQuickesRequest): Promise<void> {
    const client = getApiClient()
    await client.put('/quickes', data)
  },
}
