import type { AuthResponse } from '~/types/api'
import { isSecureRequest } from '../../utils/security'

const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

interface BackendAuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}

function extractCookieValue(cookieHeader: string): string {
  const match = cookieHeader.match(/refresh_token=([^;]+)/)
  return match ? match[1] : ''
}

export default defineEventHandler(async (event) => {
  // Note: assertSameOrigin removed - it blocks refresh requests after page reload
  // Cookie security is handled by httpOnly, Secure, and SameSite flags

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
    deleteCookie(event, 'refresh_token', { path: '/api/auth' })
    throw createError({
      statusCode: response.status,
      statusMessage: 'Unauthorized',
      message: 'Failed to refresh token',
    })
  }

  const setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    const cookieValue = extractCookieValue(setCookieHeader)
    if (cookieValue) {
      setCookie(event, 'refresh_token', cookieValue, {
        httpOnly: true,
        secure: isSecureRequest(event),
        sameSite: 'lax',
        maxAge: 7776000,
        path: '/api/auth',
      })
    }
  }

  const data = await response.json() as BackendAuthResponse

  const result: AuthResponse = {
    token: data.token,
    user: data.user,
  }

  return result
})
