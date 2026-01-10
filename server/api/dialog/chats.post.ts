import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { DialogChat } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)
  return backendRequest<DialogChat>('/v1/dialog/chats', {
    method: 'POST',
    body,
    token,
  })
})
