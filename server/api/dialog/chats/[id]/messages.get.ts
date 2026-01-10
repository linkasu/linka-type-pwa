import { backendRequest, getTokenFromRequest } from '../../../../utils/backend'
import type { DialogMessage } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const chatId = event.context.params?.id
  if (!chatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chat id is required',
    })
  }

  const query = getQuery(event)
  const params: Record<string, string | number | boolean> = {}
  if (query.limit) {
    const parsed = Number(query.limit)
    if (Number.isFinite(parsed)) {
      params.limit = parsed
    }
  }
  if (query.before) {
    const parsed = Number(query.before)
    if (Number.isFinite(parsed)) {
      params.before = parsed
    }
  }

  return backendRequest<DialogMessage[]>(`/v1/dialog/chats/${chatId}/messages`, {
    method: 'GET',
    token,
    query: params,
  })
})
