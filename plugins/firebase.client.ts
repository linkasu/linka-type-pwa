import type { FirebaseApp, FirebaseOptions } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import type { RuntimeConfig } from '~/src/renderer/app-context'

export type FirebaseAnalyticsConfig = Record<string, string | undefined>

export interface FirebaseAnalyticsSdk {
  isSupported: () => Promise<boolean>
  initializeApp: (config: FirebaseAnalyticsConfig) => FirebaseApp
  deleteApp: (app: FirebaseApp) => Promise<void>
  initializeAnalytics: (app: FirebaseApp) => Analytics
  setCollectionEnabled: (analytics: Analytics, enabled: boolean) => void
  logEvent: (
    analytics: Analytics,
    eventName: string,
    params: Record<string, string | number | boolean>,
  ) => void
}

export const createFirebaseAnalyticsConfig = (
  config: RuntimeConfig,
): FirebaseAnalyticsConfig => ({
  apiKey: config.public.firebaseApiKey,
  authDomain: config.public.firebaseAuthDomain,
  projectId: config.public.firebaseProjectId,
  storageBucket: config.public.firebaseStorageBucket,
  messagingSenderId: config.public.firebaseMessagingSenderId,
  appId: config.public.firebaseAppId,
  measurementId: config.public.firebaseMeasurementId,
})

export const hasFirebaseAnalyticsConfig = (config: FirebaseAnalyticsConfig) => Boolean(
  config.apiKey && config.projectId && config.appId && config.measurementId,
)

export const setGoogleAnalyticsDisabled = (
  measurementId: string | undefined,
  disabled: boolean,
) => {
  if (!measurementId) return
  const analyticsGlobal = globalThis as typeof globalThis & Record<string, unknown>
  analyticsGlobal[`ga-disable-${measurementId}`] = disabled
}

export const loadFirebaseAnalyticsSdk = async (): Promise<FirebaseAnalyticsSdk> => {
  const [firebaseApp, firebaseAnalytics] = await Promise.all([
    import('firebase/app'),
    import('firebase/analytics'),
  ])

  return {
    isSupported: firebaseAnalytics.isSupported,
    initializeApp: config => firebaseApp.initializeApp(
      config as FirebaseOptions,
      { automaticDataCollectionEnabled: false },
    ),
    deleteApp: firebaseApp.deleteApp,
    initializeAnalytics: app => firebaseAnalytics.initializeAnalytics(app, {
      config: { send_page_view: false },
    }),
    setCollectionEnabled: firebaseAnalytics.setAnalyticsCollectionEnabled,
    logEvent: (analytics, eventName, params) => {
      firebaseAnalytics.logEvent(analytics, eventName, params)
    },
  }
}
