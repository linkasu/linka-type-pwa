import { backendRequest, getTokenFromRequest } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const id = getRouterParam(event, 'id')

  await backendRequest(
    `/v1/statements/${id}`,
    {
      method: 'DELETE',
      token,
    }
  )

  return { success: true }
})

