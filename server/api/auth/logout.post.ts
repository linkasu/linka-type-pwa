const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')
  
  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `refresh_token=${refreshToken}`,
        },
      })
    } catch {
      // ignore logout errors
    }
  }

  deleteCookie(event, 'refresh_token')

  return { status: 'ok' }
})
