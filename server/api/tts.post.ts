import { backendRequest, getTokenFromRequest } from '../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  const response = await backendRequest(
    '/v1/tts',
    {
      method: 'POST',
      token,
      body,
    },
  )

  return response
})

