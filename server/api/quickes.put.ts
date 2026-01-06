import { backendRequest, getTokenFromRequest } from '../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  await backendRequest(
    '/v1/quickes',
    {
      method: 'PUT',
      body,
      token,
    }
  )

  return { success: true }
})

