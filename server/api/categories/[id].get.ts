import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { Category } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const id = getRouterParam(event, 'id')

  const response = await backendRequest<Category>(
    `/v1/categories/${id}`,
    {
      method: 'GET',
      token,
    }
  )

  return response
})

