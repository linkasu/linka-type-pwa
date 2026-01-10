import { backendRequest, getTokenFromRequest } from '../../../../utils/backend'
import type { DialogMessageResult } from '~/types/api'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const chatId = event.context.params?.id
  if (!chatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chat id is required',
    })
  }

  const contentType = getHeader(event, 'content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const rawBody = await readRawBody(event, false)
    if (!rawBody) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required',
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${BACKEND_URL}/v1/dialog/chats/${chatId}/messages`, {
      method: 'POST',
      headers,
      body: rawBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText,
        message: errorText,
      })
    }

    return await response.json() as DialogMessageResult
  }

  const body = await readBody(event)
  return backendRequest<DialogMessageResult>(`/v1/dialog/chats/${chatId}/messages`, {
    method: 'POST',
    body,
    token,
  })
})
