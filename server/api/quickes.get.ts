import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { QuickPhrase } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)

  const response = await backendRequest<QuickPhrase>(
    '/v1/quickes',
    {
      method: 'GET',
      token,
    }
  )

  return response
})

