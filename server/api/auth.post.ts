import type { AuthResponse } from '~/types/api'

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
  const body = await readBody(event)

  const response = await fetch(`${BACKEND_URL}/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw createError({
      statusCode: response.status,
      statusMessage: response.statusText,
      message: errorData?.error?.message || 'Authentication failed',
    })
  }

  const setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    const cookieValue = extractCookieValue(setCookieHeader)
    if (cookieValue) {
      setCookie(event, 'refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7776000,
        path: '/',
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
