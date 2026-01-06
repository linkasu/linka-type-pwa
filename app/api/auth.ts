import type { LoginRequest, AuthResponse } from '../types/api'

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await $fetch<AuthResponse>('/api/auth', {
      method: 'POST',
      body: data,
    })
    return response
  },

  async logout(): Promise<void> {
    // Logout is client-side only for now
    // If backend supports logout endpoint, add it here
  },
}

