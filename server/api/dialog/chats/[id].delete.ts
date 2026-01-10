import { backendRequest, getTokenFromRequest } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const chatId = event.context.params?.id
  if (!chatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chat id is required',
    })
  }
  return backendRequest<void>(`/v1/dialog/chats/${chatId}`, {
    method: 'DELETE',
    token,
  })
})
