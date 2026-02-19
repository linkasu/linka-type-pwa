const REFRESH_TOKEN_KEY = 'linka_refresh_token'

const getApiBaseUrl = (): string =>
  (import.meta.env.VITE_API_BASE_URL || 'https://backend.linka.su').replace(/\/$/, '')

const extractErrorMessage = (data: unknown): string => {
  if (!data || typeof data !== 'object') return 'Request failed'

  const payload = data as {
    error?: { message?: string }
    message?: string
  }

  return payload.error?.message || payload.message || 'Request failed'
}

const desktopRequest = async <T>(
  path: string,
  options: {
    method: 'GET' | 'POST'
    body?: unknown
  },
): Promise<T> => {
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
    throw new Error(extractErrorMessage(response.data))
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

export const hasDesktopBackend = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.desktop?.backend)

export const readStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const storeRefreshToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const clearRefreshToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const requestDesktopAuth = async <T>(
  path: string,
  body?: unknown,
): Promise<T> => {
  return desktopRequest<T>(path, {
    method: 'POST',
    body,
  })
}
