import { createApiClient } from '@/api/client'
import { authApi } from '@/api/auth'
import { categoriesApi } from '@/api/categories'
import { statementsApi } from '@/api/statements'
import { quickesApi } from '@/api/quickes'
import { userApi } from '@/api/user'
import { globalApi } from '@/api/global'
import { ttsApi } from '@/api/tts'
import { onboardingApi } from '@/api/onboarding'
import { predictorApi } from '@/api/predictor'
import { dialogApi } from '@/api/dialog'
import { useAuthStore } from '@/stores/auth'
import type { AppApi, RuntimeConfig } from '~/src/renderer/app-context'

export function createAppApi(config: RuntimeConfig): AppApi {
  const authStore = useAuthStore()

  const getToken = () => authStore.token
  const setToken = (token: string) => authStore.setToken(token)
  const setUser = (user: { id: string; email: string }) => authStore.setUser(user)
  const clearAuth = () => authStore.clearAuth()
  const baseUrl = config.public.apiBaseUrl?.replace(/\/$/, '') || 'https://backend.linka.su'

  // Keep one shared API client configured for /v1 backend endpoints.
  createApiClient(`${baseUrl}/v1`, getToken, setToken, setUser, clearAuth)

  return {
    auth: authApi,
    categories: categoriesApi,
    statements: statementsApi,
    quickes: quickesApi,
    user: userApi,
    global: globalApi,
    tts: ttsApi,
    onboarding: onboardingApi,
    predictor: predictorApi,
    dialog: dialogApi,
  }
}
