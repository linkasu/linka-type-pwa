import type { LoginRequest, AuthResponse, ResetPasswordRequest } from '~/types/api'

const REFRESH_TOKEN_KEY = 'linka_refresh_token'

const getApiBaseUrl = (): string =>
  (import.meta.env.VITE_API_BASE_URL || 'https://backend.linka.su').replace(/\/$/, '')

const hasDesktopBackend = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.desktop?.backend)

const readStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

const storeRefreshToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

const clearRefreshToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const extractErrorMessage = (data: unknown): string => {
  if (!data || typeof data !== 'object') return 'Request failed'

  const payload = data as {
    error?: { message?: string }
    message?: string
  }

  return payload.error?.message || payload.message || 'Request failed'
}

async function desktopRequest<T>(
  path: string,
  options: {
    method: 'GET' | 'POST'
    body?: unknown
  },
): Promise<T> {
  if (!window.desktop?.backend) {
    throw new Error('Desktop backend bridge is not available')
  }

  const response = await window.desktop.backend.request({
    url: `${getApiBaseUrl()}${path}`,
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Type': 'native',
    },
    body:
      options.body !== undefined
        ? {
          kind: 'json',
          value: options.body,
        }
        : null,
    responseType: 'json',
  })

  if (!response.ok) {
    const message = extractErrorMessage(response.data)
    throw new Error(message)
  }

  if (response.dataType === 'json') {
    return (response.data ?? {}) as T
  }

  if (response.dataType === 'text' && typeof response.data === 'string') {
    if (!response.data.trim()) {
      return {} as T
    }
    try {
      return JSON.parse(response.data) as T
    } catch {
      throw new Error(response.data)
    }
  }

  return {} as T
}

async function fetchWithCredentials<T>(url: string, options: RequestInit = {}): Promise<T> {
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
      const response = await desktopRequest<AuthResponse & { refreshToken?: string }>(
        '/v1/auth',
        {
          method: 'POST',
          body: data,
        },
      )

      if (response.refreshToken) {
        storeRefreshToken(response.refreshToken)
      }

      return {
        token: response.token,
        user: response.user,
      }
    }

    return fetchWithCredentials<AuthResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async register(data: LoginRequest): Promise<AuthResponse> {
    if (hasDesktopBackend()) {
      const response = await desktopRequest<AuthResponse & { refreshToken?: string }>(
        '/v1/auth/register',
        {
          method: 'POST',
          body: data,
        },
      )

      if (response.refreshToken) {
        storeRefreshToken(response.refreshToken)
      }

      return {
        token: response.token,
        user: response.user,
      }
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

      const response = await desktopRequest<AuthResponse & { refreshToken?: string }>(
        '/v1/auth/refresh',
        {
          method: 'POST',
          body: {
            refreshToken,
          },
        },
      )

      if (response.refreshToken) {
        storeRefreshToken(response.refreshToken)
      }

      return {
        token: response.token,
        user: response.user,
      }
    }

    return fetchWithCredentials<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    })
  },

  async logout(): Promise<void> {
    if (hasDesktopBackend()) {
      try {
        await desktopRequest<{ status?: string }>('/v1/auth/logout', {
          method: 'POST',
        })
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
      await desktopRequest('/v1/auth/reset', {
        method: 'POST',
        body: data,
      })
      return
    }

    await fetchWithCredentials('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
