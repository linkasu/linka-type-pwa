import { getApiClient } from './client'
import type { LoginRequest, AuthResponse } from '~/types/api'

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const client = getApiClient()
    const response = await client.post<AuthResponse>('/auth', data)
    return response.data
  },

  async refresh(): Promise<AuthResponse> {
    const client = getApiClient()
    const response = await client.post<AuthResponse>('/auth/refresh')
    return response.data
  },

  async logout(): Promise<void> {
    const client = getApiClient()
    await client.post('/auth/logout')
  },
}
