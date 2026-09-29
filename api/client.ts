import axios, {
  AxiosHeaders,
  type AxiosError as AxiosErrorType,
  type AxiosInstance,
} from 'axios'
import { authApi } from './auth'
import { createDesktopAdapter, hasDesktopBackend } from './transport/desktopAdapter'
import type { RequestConfig } from './transport/types'
import type { ApiError, AuthResponse } from '~/types/api'

let apiClient: AxiosInstance | null = null
let refreshPromise: Promise<AuthResponse> | null = null

const ensureAxiosHeaders = (headers?: RequestConfig['headers']): AxiosHeaders =>
  AxiosHeaders.from(headers ?? {})

export function createApiClient(
  baseURL: string,
  getToken: () => string | null,
  setToken: (token: string) => void,
  setUser: (user: { id: string; email: string }) => void,
  clearAuth: () => void,
): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: !hasDesktopBackend(),
    adapter: hasDesktopBackend() ? createDesktopAdapter(baseURL) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use(
    (config: RequestConfig) => {
      const token = getToken()
      const headers = ensureAxiosHeaders(config.headers)

      if (token && !config._skipAuth) {
        headers.set('Authorization', `Bearer ${token}`)
        if (!hasDesktopBackend()) {
          headers.set('X-Auth-Token', token)
        }
      }

      if (hasDesktopBackend()) {
        headers.set('X-Client-Type', 'native')
      }

      config.headers = headers
      return config
    },
    (error) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosErrorType<ApiError>) => {
      const originalRequest = error.config as RequestConfig | undefined

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._authRetried &&
        !originalRequest._skipAuth
      ) {
        const requestUrl = originalRequest.url || ''
        const isAuthRequest = requestUrl.includes('/auth/')

        if (isAuthRequest) {
          clearAuth()
          return Promise.reject(error)
        }

        originalRequest._authRetried = true
        let activeRefresh: Promise<AuthResponse>

        try {
          activeRefresh = refreshPromise ?? (refreshPromise = authApi.refresh())

          const response = await activeRefresh

          setToken(response.token)
          setUser(response.user)

          const headers = ensureAxiosHeaders(originalRequest.headers)
          headers.set('Authorization', `Bearer ${response.token}`)
          if (!hasDesktopBackend()) {
            headers.set('X-Auth-Token', response.token)
          }
          originalRequest.headers = headers

          return client(originalRequest)
        } catch (refreshError) {
          clearAuth()
          return Promise.reject(refreshError)
        } finally {
          if (refreshPromise === activeRefresh) refreshPromise = null
        }
      }

      if (
        error.response?.status &&
        error.response.status >= 500 &&
        originalRequest &&
        !originalRequest._serverRetried &&
        !originalRequest._skipServerRetry
      ) {
        originalRequest._serverRetried = true
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return client(originalRequest)
      }

      const apiError = error.response?.data?.error
      if (apiError) {
        const retryAfter = error.response.headers?.['retry-after']
        const err = Object.assign(new Error(apiError.message), {
          code: apiError.code,
          status: error.response.status,
          ...(retryAfter ? { retryAfter } : {}),
        })
        return Promise.reject(err)
      }

      return Promise.reject(error)
    },
  )

  apiClient = client
  return client
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.')
  }
  return apiClient
}
