import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { Category } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const query = getQuery(event)
  const includeStatements = query.include_statements === 'true'

  const params: Record<string, string> = {}
  if (includeStatements) {
    params.include_statements = 'true'
  }

  const response = await backendRequest<Category[]>(
    '/v1/global/categories',
    {
      method: 'GET',
      query: params,
      token,
    }
  )

  return response
})

