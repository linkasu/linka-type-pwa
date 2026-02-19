import { backendRequest, getTokenFromRequest } from '../utils/backend'

interface Voice {
  id: string
  name: string
  lang: string
}

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
    const response = await backendRequest<Voice[]>(
      '/v1/voices',
      {
        method: 'GET',
        token,
      },
    )
    return response
  } catch (error: unknown) {
    if (getStatusCode(error) === 404) {
      return []
    }
    throw error
  }
})
