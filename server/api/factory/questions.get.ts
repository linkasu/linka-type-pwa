import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { Question } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)

  const response = await backendRequest<{ questions: Question[] }>(
    '/v1/factory/questions',
    {
      method: 'GET',
      token,
    }
  )

  return response
})

