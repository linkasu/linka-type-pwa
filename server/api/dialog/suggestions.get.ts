import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { DialogSuggestion } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const query = getQuery(event)
  const params: Record<string, string | number | boolean> = {}
  if (query.status) {
    params.status = String(query.status)
  }
  if (query.limit) {
    const parsed = Number(query.limit)
    if (Number.isFinite(parsed)) {
      params.limit = parsed
    }
  }
  return backendRequest<DialogSuggestion[]>('/v1/dialog/suggestions', {
    method: 'GET',
    token,
    query: params,
  })
})
