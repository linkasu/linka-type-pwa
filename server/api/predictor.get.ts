import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { PredictorResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const query = getQuery(event)

  const q = query.q as string
  if (!q) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Query parameter "q" is required',
    })
  }


  const lang = (query.lang as string) || 'ru'
  const limit = query.limit ? Number(query.limit) : 5

  try {
    const response = await backendRequest<PredictorResponse>(
      '/v1/predictor',
      {
        method: 'GET',
        query: {
          q,
          lang,
          limit: limit.toString(),
        },
        token,
      }
    )

    return response
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch predictions',
    })
  }
})

