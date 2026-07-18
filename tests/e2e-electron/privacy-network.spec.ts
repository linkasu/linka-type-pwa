import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { _electron as electron, type ElectronApplication } from 'playwright'
import { isAnalyticsNetworkUrl } from '../../electron/privacyNetwork'

const devServerUrl = process.env.E2E_DEV_SERVER_URL || 'http://127.0.0.1:4174'

test('Unknown has no analytics module or network and does not block offline AAC', async () => {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'linka-type-privacy-'))
  let app: ElectronApplication | undefined

  try {
    app = await electron.launch({
      args: [
        path.join(process.cwd(), 'dist/electron/main.js'),
        `--user-data-dir=${userDataDir}`,
      ],
      env: {
        ...process.env,
        NO_PROXY: '127.0.0.1,localhost',
        no_proxy: '127.0.0.1,localhost',
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        ALL_PROXY: '',
        VITE_DEV_SERVER_URL: devServerUrl,
      },
    })

    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    const requests: string[] = []
    page.on('request', request => requests.push(request.url()))

    await page.evaluate(() => {
      localStorage.setItem('i18n_redirected', 'ru')
      localStorage.setItem('linka_mode', 'offline')
      localStorage.setItem('linka_auth', JSON.stringify({ mode: 'offline' }))
      localStorage.removeItem('analytics_consent')
      localStorage.removeItem('analytics_notice_dismissed')
    })
    requests.length = 0
    await page.reload()
    await expect(page).toHaveURL(/#\/main/, { timeout: 20_000 })

    await expect(page.getByText('Контроль аналитики и внешней обработки')).toBeVisible()
    const mainInput = page.getByRole('textbox', { name: 'Введите текст для озвучивания...' })
    await mainInput.fill('Офлайн AAC работает без решения')
    await expect(mainInput).toHaveValue('Офлайн AAC работает без решения')

    expect(await page.evaluate(() => localStorage.getItem('analytics_consent'))).toBe('Unknown')
    expect(await page.evaluate(() => 'dataLayer' in window)).toBe(false)
    expect(requests.filter(isAnalyticsNetworkUrl)).toEqual([])
    expect(requests.some(url => /firebase_(app|analytics)/i.test(url))).toBe(false)

    await page.getByRole('button', { name: 'Решить позже' }).click()
    await expect(page.getByText('Контроль аналитики и внешней обработки')).toHaveCount(0)

    await page.goto(`${devServerUrl}/app.html#/settings`)
    await page.getByRole('tab', { name: 'Приватность' }).click()
    await page.getByRole('radio', { name: 'Не собирать аналитику' }).check()
    expect(await page.evaluate(() => localStorage.getItem('analytics_consent'))).toBe('Disabled')
  } finally {
    await app?.close()
    await rm(userDataDir, { recursive: true, force: true })
  }
})
