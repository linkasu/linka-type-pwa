import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAnalytics,
  isSupported,
  setAnalyticsCollectionEnabled,
  type Analytics,
} from 'firebase/analytics'
import type { RuntimeConfig } from '~/src/renderer/app-context'

export async function initializeFirebase(
  config: RuntimeConfig,
): Promise<{ firebase: FirebaseApp | null; analytics: Analytics | null }> {
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
  }

  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('Firebase Analytics not supported in this environment')
      return { firebase: null, analytics: null }
    }

    const firebaseApp = initializeApp(firebaseConfig)
    const analytics = getAnalytics(firebaseApp)

    const consent = localStorage.getItem('analytics_consent')
    if (consent === 'denied') {
      setAnalyticsCollectionEnabled(analytics, false)
    }

    if (import.meta.dev) {
      console.log('Firebase Analytics initialized')
    }

    return { firebase: firebaseApp, analytics }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return { firebase: null, analytics: null }
  }
}
