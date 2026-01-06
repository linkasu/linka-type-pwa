import type { UserState, UpdateUserStateRequest, DeleteAccountRequest } from '../types/api'

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

export const userApi = {
  async getState(): Promise<UserState> {
    const response = await $fetch<UserState>('/api/user/state', {
      headers: getAuthHeaders(),
    })
    return response
  },

  async updateState(data: UpdateUserStateRequest): Promise<void> {
    await $fetch('/api/user/state', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data,
    })
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    await $fetch('/api/user/delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data,
    })
  },
}

