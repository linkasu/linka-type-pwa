import type { App, InjectionKey } from 'vue'
import { getCurrentInstance, inject } from 'vue'
import type { Router } from 'vue-router'
import type { Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'
import type { authApi } from '~/api/auth'
import type { categoriesApi } from '~/api/categories'
import type { statementsApi } from '~/api/statements'
import type { quickesApi } from '~/api/quickes'
import type { userApi } from '~/api/user'
import type { globalApi } from '~/api/global'
import type { ttsApi } from '~/api/tts'
import type { onboardingApi } from '~/api/onboarding'
import type { predictorApi } from '~/api/predictor'
import type { dialogApi } from '~/api/dialog'

export interface RuntimePublicConfig {
  apiBaseUrl: string
  firebaseApiKey?: string
  firebaseAuthDomain?: string
  firebaseProjectId?: string
  firebaseStorageBucket?: string
  firebaseMessagingSenderId?: string
  firebaseAppId?: string
  firebaseMeasurementId?: string
}

export interface RuntimeConfig {
  public: RuntimePublicConfig
}

export interface AppApi {
  auth: typeof authApi
  categories: typeof categoriesApi
  statements: typeof statementsApi
  quickes: typeof quickesApi
  user: typeof userApi
  global: typeof globalApi
  tts: typeof ttsApi
  onboarding: typeof onboardingApi
  predictor: typeof predictorApi
  dialog: typeof dialogApi
}

export interface AppServices {
  api: AppApi
  analytics: Analytics | null
  firebase: FirebaseApp | null
  config: RuntimeConfig
  router: Router
}

const AppServicesSymbol: InjectionKey<AppServices> = Symbol('AppServices')
let globalServices: AppServices | null = null

export function installAppServices(vueApp: App, services: AppServices) {
  globalServices = services
  vueApp.provide(AppServicesSymbol, services)
}

export function useAppServices(): AppServices {
  if (getCurrentInstance()) {
    const injected = inject<AppServices | null>(AppServicesSymbol, null)
    if (injected) return injected
  }
  if (globalServices) return globalServices
  throw new Error('App services context is not initialized')
}
