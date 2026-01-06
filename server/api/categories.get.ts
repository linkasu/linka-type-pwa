import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { Category } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)

  const response = await backendRequest<Category[]>(
    '/v1/categories',
    {
      method: 'GET',
      token,
    }
  )

  return response
})

