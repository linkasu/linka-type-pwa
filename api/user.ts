import { getApiClient } from './client'
import type { UserState, UpdateUserStateRequest, DeleteAccountRequest } from '~/types/api'

export const userApi = {
  async getState(): Promise<UserState> {
    const client = getApiClient()
    const response = await client.get<UserState>('/user/state')
    return response.data
  },

  async updateState(data: UpdateUserStateRequest): Promise<void> {
    const client = getApiClient()
    await client.put('/user/state', data)
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    const client = getApiClient()
    await client.post('/user/delete', data)
  },
}

