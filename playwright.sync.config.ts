import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e-sync',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  use: {
    trace: 'on-first-retry',
  },
})
