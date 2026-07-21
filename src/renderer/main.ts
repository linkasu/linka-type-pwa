import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AppRoot from './AppRoot.vue'
import { vuetify } from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import { router } from './router'
import { installAppServices, type AppServices, type RuntimeConfig } from './app-context'

import { createAppApi } from '~/plugins/api'
import { initializeOfflineSync } from '~/plugins/offline.client'
import { createAnalyticsService } from '~/composables/analytics/service'

import '@mdi/font/css/materialdesignicons.css'
import '~/assets/styles/main.scss'

async function bootstrap() {
  const app = createApp(AppRoot)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(vuetify)
  app.use(i18n)

  const runtimeConfig: RuntimeConfig = {
    public: {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://backend.linka.su',
    },
  }

  const api = createAppApi(runtimeConfig)
  const analytics = createAnalyticsService()

  const services: AppServices = {
    api,
    analytics,
    config: runtimeConfig,
    router,
  }

  installAppServices(app, services)
  void analytics.initialize()
  await initializeOfflineSync()

  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap renderer:', err)
})
