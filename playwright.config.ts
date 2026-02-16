import { defineConfig } from '@playwright/test'

const noProxyEnv = {
  ...process.env,
  NO_PROXY: '127.0.0.1,localhost',
  no_proxy: '127.0.0.1,localhost',
  HTTP_PROXY: '',
  HTTPS_PROXY: '',
  ALL_PROXY: '',
  http_proxy: '',
  https_proxy: '',
  all_proxy: '',
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'https://127.0.0.1:4173',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nuxi dev --host 127.0.0.1 --port 4173 --https --https.cert ./certs/localhost.crt --https.key ./certs/localhost.key',
    url: 'https://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 180_000,
    env: noProxyEnv,
  },
})
