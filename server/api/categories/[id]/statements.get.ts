import { backendRequest, getTokenFromRequest } from '../../../utils/backend'
import type { Statement } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const id = getRouterParam(event, 'id')

  const response = await backendRequest<Statement[]>(
    `/v1/categories/${id}/statements`,
    {
      method: 'GET',
      token,
    }
  )

  return response
})

