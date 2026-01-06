import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { UserState } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)

  try {
    const response = await backendRequest<UserState>(
      '/v1/user/state',
      {
        method: 'GET',
        token,
      },
    )
    return response
  } catch (error: any) {
    if (error.statusCode === 404) {
      const quickes = await backendRequest<string[]>(
        '/v1/quickes',
        { method: 'GET', token },
      )
      return {
        inited: quickes && quickes.length > 0,
        preferences: {},
      } as UserState
    }
    throw error
  }
})

