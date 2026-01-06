import { backendRequest, getTokenFromRequest } from '../utils/backend'

interface Voice {
  id: string
  name: string
  lang: string
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
  } catch (error: any) {
    if (error.statusCode === 404) {
      return []
    }
    throw error
  }
})

