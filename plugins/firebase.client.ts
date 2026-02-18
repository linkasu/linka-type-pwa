import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAnalytics,
  isSupported,
  setAnalyticsCollectionEnabled,
  type Analytics,
} from 'firebase/analytics'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
  }

  let firebaseApp: FirebaseApp | null = null
  let analytics: Analytics | null = null

  try {
    // Check if analytics is supported (not in incognito, etc.)
    const supported = await isSupported()
    if (!supported) {
      console.warn('Firebase Analytics not supported in this environment')
      return { provide: { firebase: null, analytics: null } }
    }

    firebaseApp = initializeApp(firebaseConfig)
    analytics = getAnalytics(firebaseApp)

    // Check consent status from localStorage
    const consent = localStorage.getItem('analytics_consent')
    if (consent === 'denied') {
      setAnalyticsCollectionEnabled(analytics, false)
    }

    if (import.meta.dev) {
      console.log('Firebase Analytics initialized')
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return { provide: { firebase: null, analytics: null } }
  }

  return {
    provide: {
      firebase: firebaseApp,
      analytics,
    },
  }
})
