import type { PredictorResponse } from '../types/api'

export interface PredictorRequest {
  q: string
  lang?: string
  limit?: number
}

export const predictorApi = {
  async getPredictions(params: PredictorRequest): Promise<PredictorResponse> {
    const token = import.meta.client ? localStorage.getItem('auth_token') : null
    
    const queryParams = new URLSearchParams({
      q: params.q,
      lang: params.lang || 'ru',
      limit: String(params.limit || 5),
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await $fetch<PredictorResponse>(
        `/api/predictor?${queryParams.toString()}`,
        {
          headers,
        }
      )

      return response
    } catch (error: any) {
      if (error.statusCode === 401 || error.status === 401) {
        console.warn('Predictor: Authentication required')
      }
      throw error
    }
  },
}
