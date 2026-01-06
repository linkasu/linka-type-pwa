import { backendRequest } from '../utils/backend'
import type { AuthResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await backendRequest<AuthResponse>(
    '/v1/auth',
    {
      method: 'POST',
      body,
    }
  )

  return response
})

