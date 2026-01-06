import { getApiClient } from './client'
import type { QuickPhrase, UpdateQuickesRequest } from '~/types/api'

export const quickesApi = {
  async get(): Promise<QuickPhrase> {
    const client = getApiClient()
    const response = await client.get<QuickPhrase>('/quickes')
    return response.data
  },

  async update(data: UpdateQuickesRequest): Promise<void> {
    const client = getApiClient()
    await client.put('/quickes', data)
  },
}

