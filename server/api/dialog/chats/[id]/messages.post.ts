import { backendRequest, getTokenFromRequest } from '../../../../utils/backend'
import type { DialogMessageResult } from '~/types/api'

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
    const rawBody = await readRawBody(event)
    if (!rawBody) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required',
      })
    }
    return backendRequest<DialogMessageResult>(`/v1/dialog/chats/${chatId}/messages`, {
      method: 'POST',
      rawBody,
      token,
      headers: {
        'Content-Type': contentType,
      },
    })
  }

  const body = await readBody(event)
  return backendRequest<DialogMessageResult>(`/v1/dialog/chats/${chatId}/messages`, {
    method: 'POST',
    body,
    token,
  })
})
