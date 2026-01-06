import { createApiClient } from '@/api/client'
import { authApi } from '@/api/auth'
import { categoriesApi } from '@/api/categories'
import { statementsApi } from '@/api/statements'
import { quickesApi } from '@/api/quickes'
import { userApi } from '@/api/user'
import { globalApi } from '@/api/global'
import { ttsApi } from '@/api/tts'
import { onboardingApi } from '@/api/onboarding'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const getToken = () => {
    if (import.meta.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  createApiClient('/api', getToken)

  return {
    provide: {
      api: {
        auth: authApi,
        categories: categoriesApi,
        statements: statementsApi,
        quickes: quickesApi,
        user: userApi,
        global: globalApi,
        tts: ttsApi,
        onboarding: onboardingApi,
      },
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $api: {
      auth: typeof authApi
      categories: typeof categoriesApi
      statements: typeof statementsApi
      quickes: typeof quickesApi
      user: typeof userApi
      global: typeof globalApi
      tts: typeof ttsApi
      onboarding: typeof onboardingApi
    }
  }
}
