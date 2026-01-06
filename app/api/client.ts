import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { ApiError } from '../types/api'

let apiClient: AxiosInstance | null = null

export function createApiClient(baseURL: string, getToken: () => string | null): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        // Clear auth and redirect to login
        if (import.meta.client) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // Handle 5xx errors with retry
      if (
        error.response?.status &&
        error.response.status >= 500 &&
        originalRequest &&
        !(originalRequest as Record<string, unknown>)._retry
      ) {
        (originalRequest as Record<string, unknown>)._retry = true
        
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        return client(originalRequest)
      }

      // Transform error message
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

