import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts', 'tests/main/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
