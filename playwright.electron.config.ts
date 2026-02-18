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

const devServerPort = 4174

export default defineConfig({
  testDir: './tests/e2e-electron',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  use: {
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build:electron && vite --host 127.0.0.1 --port 4174',
    port: devServerPort,
    reuseExistingServer: false,
    timeout: 180_000,
    env: noProxyEnv,
  },
})
