import { backendRequest } from '../utils/backend'
import type { AuthResponse } from '~/types/api'

interface BackendAuthResponse {
  token: string
}

function decodeJwtPayload(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
  return JSON.parse(payload)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await backendRequest<BackendAuthResponse>(
    '/v1/auth',
    {
      method: 'POST',
      body,
    },
  )

  const payload = decodeJwtPayload(response.token)

  const result: AuthResponse = {
    token: response.token,
    user: {
      id: payload?.user_id || payload?.sub || '',
      email: payload?.email || '',
    },
  }

  return result
})

