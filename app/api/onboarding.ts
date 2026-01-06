import type { Question, OnboardingRequest, OnboardingResult } from '../types/api'

function getAuthHeaders(): Record<string, string> {
  const token = import.meta.client ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const onboardingApi = {
  async getQuestions(): Promise<Question[]> {
    const response = await $fetch<{ questions: Question[] }>('/api/factory/questions', {
      headers: getAuthHeaders(),
    })
    return response.questions
  },

  async generatePhrases(data: OnboardingRequest): Promise<OnboardingResult> {
    const response = await $fetch<OnboardingResult>('/api/onboarding/phrases', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },
}

