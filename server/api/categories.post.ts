import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { Category } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  const response = await backendRequest<Category>(
    '/v1/categories',
    {
      method: 'POST',
      body,
      token,
    }
  )

  return response
})

