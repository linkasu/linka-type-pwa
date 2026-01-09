export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  devServer: {
    https: process.env.NODE_ENV === 'development' ? {
      key: './certs/localhost.key',
      cert: './certs/localhost.crt'
    } : undefined,
    port: 3000,
    host: '0.0.0.0',
  },

  app: {
    head: {
      title: 'LINKa: напиши',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Приложение для коммуникации людей с нарушениями речи' },
        { name: 'theme-color', content: '#197377' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180x180.png' },
      ],
    },
  },

  css: [
    '@mdi/font/css/materialdesignicons.css',
    '@/assets/styles/main.scss',
  ],

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt',
    'vuetify-nuxt-module',
  ],

  vuetify: {
    moduleOptions: {
      styles: true,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#197377',
              secondary: '#bed64f',
              accent: '#fbcc30',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FFC107',
              background: '#FFFFFF',
              surface: '#FFFFFF',
            },
          },
          dark: {
            dark: true,
            colors: {
              primary: '#26A69A',
              secondary: '#bed64f',
              accent: '#fbcc30',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FFC107',
              background: '#121212',
              surface: '#1E1E1E',
            },
          },
        },
      },
      defaults: {
        VBtn: {
          variant: 'flat',
          rounded: 'lg',
        },
        VCard: {
          rounded: 'lg',
          elevation: 2,
        },
        VTextField: {
          variant: 'outlined',
          density: 'comfortable',
        },
        VTextarea: {
          variant: 'outlined',
          density: 'comfortable',
        },
      },
    },
  },

  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'ru',
    lazy: true,
    bundle: {
      fullInstall: false,
    },
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'icons/*.png'],
    manifest: {
      id: '/',
      name: 'LINKa: напиши',
      short_name: 'LINKa',
      description: 'Приложение для коммуникации людей с нарушениями речи',
      theme_color: '#197377',
      background_color: '#fbcc30',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      lang: 'ru',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: process.env.NUXT_PWA_DEV === 'true',
      type: 'module',
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'https://backend.linka.su',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
