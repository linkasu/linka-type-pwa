import { backendRequest, getTokenFromRequest } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)
  return backendRequest<void>('/v1/dialog/suggestions/dismiss', {
    method: 'POST',
    body,
    token,
  })
})
