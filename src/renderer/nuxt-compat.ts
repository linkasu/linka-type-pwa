import type { App } from 'vue'
import { getCurrentInstance, inject, ref, type Ref } from 'vue'
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

export interface NuxtLikeApp {
  $api: AppApi
  $analytics: Analytics | null
  $firebase: FirebaseApp | null
  $config: RuntimeConfig
  provide: (name: string, value: unknown) => void
}

type NuxtPluginResult = { provide?: Record<string, unknown> } | void
type NuxtPlugin = (nuxtApp: NuxtLikeApp) => NuxtPluginResult | Promise<NuxtPluginResult>

const NuxtAppSymbol = Symbol('NuxtLikeApp')
let globalNuxtApp: NuxtLikeApp | null = null
let globalRouter: Router | null = null
const stateMap = new Map<string, Ref<unknown>>()

export function setNuxtAppContext(app: NuxtLikeApp, router: Router) {
  globalNuxtApp = app
  globalRouter = router
}

export function installNuxtCompat(vueApp: App, app: NuxtLikeApp) {
  vueApp.provide(NuxtAppSymbol, app)
}

export function useNuxtApp(): NuxtLikeApp {
  if (getCurrentInstance()) {
    const injected = inject<NuxtLikeApp | null>(NuxtAppSymbol, null)
    if (injected) return injected
  }
  if (globalNuxtApp) return globalNuxtApp
  throw new Error('Nuxt-like app context is not initialized')
}

export function useRuntimeConfig(): RuntimeConfig {
  return useNuxtApp().$config
}

export function defineNuxtPlugin<T>(plugin: T): T {
  return plugin
}

export function defineNuxtRouteMiddleware<T>(middleware: T): T {
  return middleware
}

export function definePageMeta(_meta: Record<string, unknown>): void {
  // Nuxt page meta is mapped in router definitions for desktop runtime.
}

export async function navigateTo(to: string): Promise<void> {
  if (!globalRouter) throw new Error('Router is not initialized')
  if (globalRouter.currentRoute.value.fullPath === to) return
  await globalRouter.push(to)
}

export function useState<T>(key: string, init: () => T): Ref<T> {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init()) as Ref<unknown>)
  }
  return stateMap.get(key) as Ref<T>
}

export async function runNuxtPlugin(plugin: unknown, nuxtApp: NuxtLikeApp): Promise<void> {
  if (typeof plugin !== 'function') return
  const result = await (plugin as NuxtPlugin)(nuxtApp)
  if (result && typeof result === 'object' && 'provide' in result) {
    const provide = (result as { provide?: Record<string, unknown> }).provide ?? {}
    for (const [key, value] of Object.entries(provide)) {
      nuxtApp.provide(key, value)
    }
  }
}
