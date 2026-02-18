import type { Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'
import type { NuxtLikeApp } from '~/src/renderer/nuxt-compat'

declare module '#app' {
  interface NuxtApp {
    $api: NuxtLikeApp['$api']
    $analytics: Analytics | null
    $firebase: FirebaseApp | null
    $config: {
      public: {
        apiBaseUrl: string
      }
    }
  }
}

export {}
