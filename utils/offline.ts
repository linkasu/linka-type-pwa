const isBrowser = () => typeof window !== 'undefined'

export const isOffline = (): boolean => {
  if (!isBrowser()) return false
  return navigator.onLine === false
}

export const isNetworkError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  const maybe = err as {
    isAxiosError?: boolean
    code?: string
    message?: string
    response?: unknown
  }

  if (maybe.isAxiosError && !maybe.response) return true
  if (maybe.code === 'ERR_NETWORK' || maybe.code === 'ECONNABORTED') return true
  if (typeof maybe.message === 'string' && maybe.message.toLowerCase().includes('network')) return true
  return false
}

export const shouldQueueOffline = (err?: unknown): boolean => {
  return isOffline() || isNetworkError(err)
}

export const generateTempId = (prefix: string): string => {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}
