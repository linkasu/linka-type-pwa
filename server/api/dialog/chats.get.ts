import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { DialogChat } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  return backendRequest<DialogChat[]>('/v1/dialog/chats', {
    method: 'GET',
    token,
  })
})
