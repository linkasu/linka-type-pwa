import { getApiClient } from './client'
import type { Question, OnboardingRequest, OnboardingResult } from '~/types/api'

export const onboardingApi = {
  async getQuestions(): Promise<Question[]> {
    const client = getApiClient()
    const response = await client.get<{ questions: Question[] }>('/factory/questions')
    return response.data.questions
  },

  async generatePhrases(data: OnboardingRequest): Promise<OnboardingResult> {
    const client = getApiClient()
    const response = await client.post<OnboardingResult>('/onboarding/phrases', data)
    return response.data
  },
}

