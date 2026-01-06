import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { UserState } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)

  const response = await backendRequest<UserState>(
    '/v1/user/state',
    {
      method: 'GET',
      token,
    }
  )

  return response
})

