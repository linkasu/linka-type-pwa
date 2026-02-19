import type { LoginRequest, AuthResponse, ResetPasswordRequest } from '~/types/api'
import {
  clearRefreshToken,
  hasDesktopBackend,
  readStoredRefreshToken,
  requestDesktopAuth,
  storeRefreshToken,
} from './authDesktop'

type DesktopAuthResponse = AuthResponse & {
  refreshToken?: string
}

const mapDesktopAuthResponse = (response: DesktopAuthResponse): AuthResponse => {
  if (response.refreshToken) {
    storeRefreshToken(response.refreshToken)
  }

  return {
    token: response.token,
    user: response.user,
  }
}

const fetchWithCredentials = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => ({})) as {
    error?: { message?: string }
    message?: string
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'Request failed')
  }

  return data as T
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    if (hasDesktopBackend()) {
      const response = await requestDesktopAuth<DesktopAuthResponse>('/v1/auth', data)
      return mapDesktopAuthResponse(response)
    }

    return fetchWithCredentials<AuthResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async register(data: LoginRequest): Promise<AuthResponse> {
    if (hasDesktopBackend()) {
      const response = await requestDesktopAuth<DesktopAuthResponse>('/v1/auth/register', data)
      return mapDesktopAuthResponse(response)
    }

    return fetchWithCredentials<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async refresh(): Promise<AuthResponse> {
    if (hasDesktopBackend()) {
      const refreshToken = readStoredRefreshToken()
      if (!refreshToken) {
        throw new Error('Missing refresh token')
      }

      const response = await requestDesktopAuth<DesktopAuthResponse>('/v1/auth/refresh', {
        refreshToken,
      })

      return mapDesktopAuthResponse(response)
    }

    return fetchWithCredentials<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    })
  },

  async logout(): Promise<void> {
    if (hasDesktopBackend()) {
      try {
        await requestDesktopAuth('/v1/auth/logout')
      } finally {
        clearRefreshToken()
      }
      return
    }

    await fetchWithCredentials<void>('/api/auth/logout', {
      method: 'POST',
    })
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    if (hasDesktopBackend()) {
      await requestDesktopAuth('/v1/auth/reset', data)
      return
    }

    await fetchWithCredentials('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
