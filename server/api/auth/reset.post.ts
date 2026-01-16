const BACKEND_URL = process.env.API_BASE_URL || 'https://backend.linka.su'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await fetch(`${BACKEND_URL}/v1/auth/reset`, {
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
      message: errorData?.error?.message || 'Password reset failed',
    })
  }

  return { status: 'ok' }
})
