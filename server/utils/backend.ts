import { ofetch } from 'ofetch'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

export async function backendRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, string | number | boolean>
    token?: string | null
  } = {}
): Promise<T> {
  const { method = 'GET', body, query, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await ofetch<T>(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      query,
      timeout: 30000,
      retry: 0,
    })

    if (response && typeof response === 'object' && 'error' in response) {
      const errorData = (response as any).error
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: errorData?.message || 'Backend service error',
        data: { error: errorData },
      })
    }

    return response
  } catch (error: any) {
    if (error.name === 'FetchError' && (error.cause?.code === 'ECONNREFUSED' || error.cause?.code === 'ETIMEDOUT')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Backend service is unavailable',
      })
    }

    const statusCode = error.status || error.statusCode || error.response?.status || 500
    const errorData = error.data || error.response?.data
    const errorMessage = errorData?.error?.message || error.message || error.response?.data?.error?.message || ''
    
    if (statusCode === 401 || 
        errorData?.error?.code === 'unauthorized' || 
        (errorMessage && (errorMessage.includes('401') || errorMessage.includes('Unauthorized')))) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Unauthorized',
      })
    }

    const finalErrorMessage = errorMessage || 'Backend request failed'

    if (errorData?.error) {
      const finalStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500
      throw createError({
        statusCode: finalStatusCode,
        statusMessage: error.statusText || error.response?.statusText || 'Server Error',
        message: finalErrorMessage,
        data: errorData,
      })
    }

    const finalStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500
    throw createError({
      statusCode: finalStatusCode,
      statusMessage: error.statusText || error.response?.statusText || 'Server Error',
      message: errorMessage,
      data: errorData,
    })
  }
}

export function getTokenFromRequest(event: any): string | null {
  const authHeader = event.node.req.headers.authorization
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const cookie = getCookie(event, 'auth_token')
  if (cookie) {
    return cookie
  }

  return null
}

