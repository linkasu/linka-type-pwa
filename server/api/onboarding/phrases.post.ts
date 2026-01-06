import { backendRequest, getTokenFromRequest } from '../../utils/backend'
import type { OnboardingResult } from '~/types/api'

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event)
  const body = await readBody(event)

  const response = await backendRequest<OnboardingResult>(
    '/v1/onboarding/phrases',
    {
      method: 'POST',
      body,
      token,
    }
  )

  return response
})

