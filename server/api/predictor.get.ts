import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { PredictorResponse } from '~/types/api'

function getStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const statusCode = (error as Record<string, unknown>).statusCode
  return typeof statusCode === 'number' ? statusCode : null
}

function getErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const message = (error as Record<string, unknown>).message
  return typeof message === 'string' ? message : null
}

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
  } catch (error: unknown) {
    if (getStatusCode(error)) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: getErrorMessage(error) || 'Failed to fetch predictions',
    })
  }
})
