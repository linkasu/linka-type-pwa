import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { ApiError, AuthResponse } from '~/types/api'

let apiClient: AxiosInstance | null = null
let refreshPromise: Promise<AuthResponse> | null = null

interface RequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _skipAuth?: boolean
}

export function createApiClient(
  baseURL: string, 
  getToken: () => string | null,
  setToken: (token: string) => void,
  setUser: (user: { id: string; email: string }) => void,
  clearAuth: () => void
): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use(
    (config: RequestConfig) => {
      const token = getToken()
      if (token && !config._skipAuth) {
        // Use X-Auth-Token instead of Authorization to avoid YC serverless interception
        config.headers['X-Auth-Token'] = token
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as RequestConfig | undefined

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh')
        const isAuthRequest = originalRequest.url?.includes('/auth') && !isRefreshRequest
        
        if (isRefreshRequest || isAuthRequest) {
          clearAuth()
          if (import.meta.client && !isAuthRequest) {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          if (!refreshPromise) {
            refreshPromise = client.post<AuthResponse>('/auth/refresh').then(res => res.data)
          }
          
          const response = await refreshPromise
          refreshPromise = null
          
          setToken(response.token)
          setUser(response.user)
          
          originalRequest.headers['X-Auth-Token'] = response.token
          return client(originalRequest)
        } catch (refreshError) {
          refreshPromise = null
          clearAuth()
          if (import.meta.client) {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      }

      if (
        error.response?.status &&
        error.response.status >= 500 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return client(originalRequest)
      }

      const apiError = error.response?.data?.error
      if (apiError) {
        const err = new Error(apiError.message)
        ;(err as Record<string, unknown>).code = apiError.code
        return Promise.reject(err)
      }

      return Promise.reject(error)
    }
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
