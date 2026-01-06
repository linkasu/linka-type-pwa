import { backendRequest, getTokenFromRequest } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  await backendRequest(
    '/v1/user/delete',
    {
      method: 'POST',
      body,
      token,
    }
  )

  return { success: true }
})

