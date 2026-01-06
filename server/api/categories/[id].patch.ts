import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { Category } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const response = await backendRequest<Category>(
    `/v1/categories/${id}`,
    {
      method: 'PATCH',
      body,
      token,
    }
  )

  return response
})

