import { backendRequest, getTokenFromRequest } from '../../../utils/backend'
import type { DialogSuggestionApplyResult } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)
  return backendRequest<DialogSuggestionApplyResult>('/v1/dialog/suggestions/apply', {
    method: 'POST',
    body,
    token,
  })
})
