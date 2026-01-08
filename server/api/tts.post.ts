import { getTokenFromRequest } from '../utils/backend'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

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
    let errorData: any

    if (contentType.includes('application/json')) {
      errorData = await response.json().catch(() => null)
      errorMessage = errorData?.error?.message || errorMessage
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
