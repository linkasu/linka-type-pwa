import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosError as AxiosErrorType,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { authApi } from './auth'
import type { ApiError, AuthResponse } from '~/types/api'

let apiClient: AxiosInstance | null = null
let refreshPromise: Promise<AuthResponse> | null = null

interface RequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _skipAuth?: boolean
}

type DesktopBackendBodyPayload =
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string; contentType?: string }
  | {
    kind: 'form-data'
    entries: Array<
      | { kind: 'text'; name: string; value: string }
      | {
        kind: 'file'
        name: string
        filename?: string
        contentType?: string
        base64: string
      }
    >
  }

interface DesktopBackendRequestPayload {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: DesktopBackendBodyPayload | null
  responseType?: 'json' | 'text' | 'arraybuffer'
}

interface DesktopBackendResponsePayload {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  dataType: 'json' | 'text' | 'base64'
  data: unknown
}

const hasDesktopBackend = () =>
  typeof window !== 'undefined' && Boolean(window.desktop?.backend)

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

const fromBase64 = (value: string): ArrayBuffer => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const ensureAxiosHeaders = (headers?: RequestConfig['headers']): AxiosHeaders =>
  AxiosHeaders.from(headers ?? {})

const normalizeHeaders = (headers: RequestConfig['headers']): Record<string, string> => {
  const raw = headers instanceof AxiosHeaders ? headers.toJSON() : headers
  if (!raw) return {}

  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === undefined || value === null) continue
    normalized[key] = Array.isArray(value) ? value.join(', ') : String(value)
  }
  return normalized
}

const buildRequestUrl = (baseURL: string, config: RequestConfig): string => {
  const rawUrl = config.url || ''
  const url = /^https?:\/\//i.test(rawUrl)
    ? new URL(rawUrl)
    : new URL(rawUrl, baseURL.endsWith('/') ? baseURL : `${baseURL}/`)

  const params = config.params
  if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach((item) => {
          url.searchParams.append(key, String(item))
        })
      } else {
        url.searchParams.append(key, String(value))
      }
    }
  }

  return url.toString()
}

const isFormDataValue = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData

const buildRequestBody = async (
  config: RequestConfig,
): Promise<DesktopBackendBodyPayload | null> => {
  const method = String(config.method || 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD') return null

  const data = config.data
  if (data === undefined || data === null || data === '') return null

  if (isFormDataValue(data)) {
    const entries: Array<
      | { kind: 'text'; name: string; value: string }
      | {
        kind: 'file'
        name: string
        filename?: string
        contentType?: string
        base64: string
      }
    > = []

    for (const [name, value] of data.entries()) {
      if (typeof value === 'string') {
        entries.push({ kind: 'text', name, value })
        continue
      }
      const file = value as File
      const bytes = new Uint8Array(await file.arrayBuffer())
      entries.push({
        kind: 'file',
        name,
        filename: file.name || 'file',
        contentType: file.type || 'application/octet-stream',
        base64: toBase64(bytes),
      })
    }

    return { kind: 'form-data', entries }
  }

  if (typeof data === 'string') {
    return { kind: 'text', value: data }
  }

  if (data instanceof ArrayBuffer) {
    return {
      kind: 'binary',
      base64: toBase64(new Uint8Array(data)),
      contentType: 'application/octet-stream',
    }
  }

  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    return {
      kind: 'binary',
      base64: toBase64(bytes),
      contentType: 'application/octet-stream',
    }
  }

  return { kind: 'json', value: data }
}

const createDesktopAdapter = (baseURL: string): AxiosAdapter => {
  return async (config) => {
    if (!window.desktop?.backend) {
      throw new AxiosError('Desktop backend bridge is not available', 'ERR_NETWORK', config)
    }

    const requestConfig = config as RequestConfig
    const payload: DesktopBackendRequestPayload = {
      url: buildRequestUrl(baseURL, requestConfig),
      method: String(requestConfig.method || 'GET').toUpperCase(),
      headers: normalizeHeaders(requestConfig.headers),
      body: await buildRequestBody(requestConfig),
      responseType:
        requestConfig.responseType === 'arraybuffer'
          ? 'arraybuffer'
          : requestConfig.responseType === 'text'
            ? 'text'
            : 'json',
    }

    const result = await window.desktop.backend.request(payload) as DesktopBackendResponsePayload

    let data: unknown = result.data
    if (result.dataType === 'base64' && typeof result.data === 'string') {
      data = fromBase64(result.data)
    }

    const response: AxiosResponse = {
      data,
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      config,
      request: payload,
    }

    if (!result.ok) {
      throw new AxiosError(
        `Request failed with status code ${result.status}`,
        'ERR_BAD_RESPONSE',
        config,
        payload,
        response,
      )
    }

    return response
  }
}

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
        !originalRequest._retry &&
        !originalRequest._skipAuth
      ) {
        const requestUrl = originalRequest.url || ''
        const isAuthRequest = requestUrl.includes('/auth/')

        if (isAuthRequest) {
          clearAuth()
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          if (!refreshPromise) {
            refreshPromise = authApi.refresh()
          }

          const response = await refreshPromise
          refreshPromise = null

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
          refreshPromise = null
          clearAuth()
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
        ;(err as unknown as Record<string, unknown>).code = apiError.code
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
