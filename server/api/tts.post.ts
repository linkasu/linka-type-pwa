import { getTokenFromRequest } from '../utils/backend'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

function extractErrorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const data = value as Record<string, unknown>
  if (typeof data.error !== 'object' || data.error === null) {
    return null
  }

  const error = data.error as Record<string, unknown>
  return typeof error.message === 'string' ? error.message : null
}

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BACKEND_URL}/v1/tts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    let errorMessage = 'TTS request failed'
    let errorData: unknown

    if (contentType.includes('application/json')) {
      errorData = await response.json().catch(() => null)
      errorMessage = extractErrorMessage(errorData) || errorMessage
    }

    throw createError({
      statusCode: response.status,
      statusMessage: response.statusText,
      message: errorMessage,
      data: errorData,
    })
  }

  const contentType = response.headers.get('content-type') || 'audio/mpeg'
  const cacheControl = response.headers.get('cache-control')
  if (cacheControl) {
    setHeader(event, 'Cache-Control', cacheControl)
  }
  setHeader(event, 'Content-Type', contentType)

  const buffer = Buffer.from(await response.arrayBuffer())
  return buffer
})
