import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    AutoImport({
      imports: [
        'vue',
        'pinia',
        'vue-router',
        {
          '~/src/renderer/use-i18n-compat': ['useI18n'],
        },
      ],
      dirs: ['composables'],
      dts: 'src/renderer/auto-imports.d.ts',
      vueTemplate: true,
    }),
    Components({
      dirs: ['components'],
      deep: true,
      dts: 'src/renderer/components.d.ts',
      directoryAsNamespace: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
    },
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
