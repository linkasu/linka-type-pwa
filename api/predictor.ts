import { getApiClient } from './client'
import type { PredictorResponse } from '~/types/api'

export interface PredictorOptions {
  lang?: string
  limit?: number
}

export const predictorApi = {
  async complete(text: string, options: PredictorOptions = {}): Promise<PredictorResponse> {
    const client = getApiClient()
    const response = await client.get<PredictorResponse>('/predictor', {
      params: {
        q: text,
        lang: options.lang ?? 'ru',
        limit: options.limit ?? 5,
      },
    })
    return response.data
  },
}
