import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { UserState } from '~/types/api'

function getStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const statusCode = (error as Record<string, unknown>).statusCode
  return typeof statusCode === 'number' ? statusCode : null
}

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
  } catch (error: unknown) {
    if (getStatusCode(error) === 404) {
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
