import { backendRequest, getTokenFromRequest } from '../utils/backend'
import type { Statement } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  const response = await backendRequest<Statement>(
    '/v1/statements',
    {
      method: 'POST',
      body,
      token,
    }
  )

  return response
})

