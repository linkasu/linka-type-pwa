import type { QuickPhrase, UpdateQuickesRequest } from '../types/api'

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

export const quickesApi = {
  async get(): Promise<QuickPhrase> {
    const response = await $fetch<QuickPhrase>('/api/quickes', {
      headers: getAuthHeaders(),
    })
    return response
  },

  async update(data: UpdateQuickesRequest): Promise<void> {
    await $fetch('/api/quickes', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data,
    })
  },
}

