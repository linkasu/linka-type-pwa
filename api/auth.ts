import type { LoginRequest, AuthResponse, ResetPasswordRequest } from '~/types/api'

async function fetchWithCredentials<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }))
    throw new Error(error.error?.message || 'Request failed')
  }
  
  return response.json()
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return fetchWithCredentials<AuthResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async register(data: LoginRequest): Promise<AuthResponse> {
    return fetchWithCredentials<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async refresh(): Promise<AuthResponse> {
    return fetchWithCredentials<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    })
  },

  async logout(): Promise<void> {
    await fetchWithCredentials<void>('/api/auth/logout', {
      method: 'POST',
    })
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await fetchWithCredentials('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
