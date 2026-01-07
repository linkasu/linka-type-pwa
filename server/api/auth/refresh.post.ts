import type { AuthResponse } from '~/types/api'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

interface BackendAuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')
  
  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Missing refresh token',
    })
  }

  const response = await fetch(`${BACKEND_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `refresh_token=${refreshToken}`,
    },
  })

  if (!response.ok) {
    deleteCookie(event, 'refresh_token')
    throw createError({
      statusCode: response.status,
      statusMessage: 'Unauthorized',
      message: 'Failed to refresh token',
    })
  }

  const data = await response.json() as BackendAuthResponse

  const result: AuthResponse = {
    token: data.token,
    user: data.user,
  }

  return result
})
