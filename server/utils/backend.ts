import { ofetch } from 'ofetch'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'
type RequestEvent = Parameters<typeof getCookie>[0]

interface BackendErrorLike {
  name?: string
  message?: string
  status?: number
  statusCode?: number
  statusText?: string
  cause?: { code?: string }
  data?: unknown
  response?: {
    status?: number
    statusText?: string
    data?: unknown
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  return value as Record<string, unknown>
}

function normalizeError(error: unknown): BackendErrorLike {
  const record = asRecord(error)
  if (!record) {
    return {}
  }
  return record as BackendErrorLike
}

function extractErrorMessage(value: unknown): string | null {
  const dataRecord = asRecord(value)
  if (!dataRecord) {
    return null
  }
  const errorRecord = asRecord(dataRecord.error)
  if (!errorRecord) {
    return null
  }
  return typeof errorRecord.message === 'string' ? errorRecord.message : null
}

function extractErrorCode(value: unknown): string | null {
  const dataRecord = asRecord(value)
  if (!dataRecord) {
    return null
  }
  const errorRecord = asRecord(dataRecord.error)
  if (!errorRecord) {
    return null
  }
  return typeof errorRecord.code === 'string' ? errorRecord.code : null
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? null
  }
  return null
}

export async function backendRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    rawBody?: string | ArrayBuffer | Uint8Array
    query?: Record<string, string | number | boolean>
    token?: string | null
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const { method = 'GET', body, rawBody, query, token, headers: customHeaders } = options
  const headers: Record<string, string> = { ...customHeaders }
  const hasContentType = Object.keys(headers).some(
    key => key.toLowerCase() === 'content-type'
  )
  if (!hasContentType && rawBody === undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await ofetch<T>(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: rawBody !== undefined ? rawBody : body ? JSON.stringify(body) : undefined,
      query,
      timeout: 30000,
      retry: 0,
    })

    const responseRecord = asRecord(response)
    if (responseRecord && 'error' in responseRecord) {
      const errorData = responseRecord.error
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: extractErrorMessage({ error: errorData }) || 'Backend service error',
        data: { error: errorData },
      })
    }

    return response
  } catch (error: unknown) {
    const normalizedError = normalizeError(error)
    const errorCauseCode = normalizedError.cause?.code

    if (
      normalizedError.name === 'FetchError'
      && (errorCauseCode === 'ECONNREFUSED' || errorCauseCode === 'ETIMEDOUT')
    ) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Backend service is unavailable',
      })
    }

    const statusCode = normalizedError.status
      || normalizedError.statusCode
      || normalizedError.response?.status
      || 500
    const errorData = normalizedError.data || normalizedError.response?.data
    const errorMessage = extractErrorMessage(errorData)
      || normalizedError.message
      || extractErrorMessage(normalizedError.response?.data)
      || ''

    if (
      statusCode === 401
      || extractErrorCode(errorData) === 'unauthorized'
      || (errorMessage && (errorMessage.includes('401') || errorMessage.includes('Unauthorized')))
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Unauthorized',
      })
    }

    const finalErrorMessage = errorMessage || 'Backend request failed'

    const errorDataRecord = asRecord(errorData)
    if (errorDataRecord && 'error' in errorDataRecord) {
      const finalStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500
      throw createError({
        statusCode: finalStatusCode,
        statusMessage: normalizedError.statusText || normalizedError.response?.statusText || 'Server Error',
        message: finalErrorMessage,
        data: errorData,
      })
    }

    const finalStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500
    throw createError({
      statusCode: finalStatusCode,
      statusMessage: normalizedError.statusText || normalizedError.response?.statusText || 'Server Error',
      message: finalErrorMessage,
      data: errorData,
    })
  }
}

export function getTokenFromRequest(event: RequestEvent): string | null {
  // First check X-Auth-Token header (used to avoid YC serverless Authorization interception)
  const xAuthToken = getHeaderValue(event.node.req.headers['x-auth-token'])
  if (xAuthToken) {
    return xAuthToken
  }

  // Fallback to Authorization header for backward compatibility
  const authHeader = getHeaderValue(event.node.req.headers.authorization)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const cookie = getCookie(event, 'auth_token')
  if (cookie) {
    return cookie
  }

  return null
}
