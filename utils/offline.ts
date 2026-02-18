const isBrowser = () => typeof window !== 'undefined'
const MODE_STORAGE_KEY = 'linka_mode'

export const getAppMode = (): 'online' | 'offline' | null => {
  if (!isBrowser()) return null
  const value = localStorage.getItem(MODE_STORAGE_KEY)
  if (value === 'online' || value === 'offline') return value
  return null
}

export const isOffline = (): boolean => {
  if (!isBrowser()) return false
  const mode = getAppMode()
  if (mode === 'offline') return true
  return navigator.onLine === false
}

export const isNetworkError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  const maybe = err as {
    isAxiosError?: boolean
    code?: string
    message?: string
    response?: {
      status?: number
    }
  }

  if (maybe.isAxiosError && !maybe.response) return true
  if (maybe.code === 'ERR_NETWORK' || maybe.code === 'ECONNABORTED') return true
  if (maybe.response?.status && [401, 403, 404, 408, 425, 429, 500, 502, 503, 504].includes(maybe.response.status)) {
    return true
  }
  if (typeof maybe.message === 'string' && maybe.message.toLowerCase().includes('network')) return true
  if (typeof maybe.message === 'string' && maybe.message.toLowerCase().includes('cors')) return true
  return false
}

export const shouldQueueOffline = (err?: unknown): boolean => {
  return isOffline() || isNetworkError(err)
}

export const generateTempId = (prefix: string): string => {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}
