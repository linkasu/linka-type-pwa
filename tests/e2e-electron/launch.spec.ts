import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { _electron as electron, type ElectronApplication, type Page } from 'playwright'

const devServerUrl = process.env.E2E_DEV_SERVER_URL || 'http://127.0.0.1:4174'

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

async function setWindowSize(app: ElectronApplication, width: number, height: number) {
  return app.evaluate(({ BrowserWindow }, size) => {
    const window = BrowserWindow.getAllWindows()[0]
    window.setSize(size.width, size.height)
    return window.getBounds()
  }, { width, height })
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBeTruthy()
}

async function resetModeSelection(page: Page) {
  await page.waitForURL(/#\/(login|main|settings|chat)/, { timeout: 30_000 })
  if (!page.url().includes('#/login')) {
    await page.goto(`${devServerUrl}/#/login`)
  }

  await page.evaluate(() => {
    localStorage.setItem('i18n_redirected', 'ru')
    localStorage.removeItem('linka_mode')
    localStorage.removeItem('linka_auth')
  })
  await page.reload()
  await expect(page).toHaveURL(/#\/login/, { timeout: 15_000 })
}

async function continueInOfflineMode(page: Page) {
  await expect(page.getByText('Режим при первом запуске')).toBeVisible()

  await page.evaluate(() => {
    localStorage.setItem('linka_mode', 'offline')

    const raw = localStorage.getItem('linka_auth')
    let parsed: Record<string, unknown> = {}
    try {
      parsed = raw ? JSON.parse(raw) : {}
    } catch {
      parsed = {}
    }
    localStorage.setItem('linka_auth', JSON.stringify({ ...parsed, mode: 'offline' }))
  })

  await page.reload()
  await page.waitForURL(/#\/(login|main)/, { timeout: 15_000 })
  if (page.url().includes('#/login')) {
    const confirmModeButton = page.getByRole('button', { name: /Подтвердить|Confirm/i }).first()
    if (await confirmModeButton.isVisible().catch(() => false)) {
      await confirmModeButton.click()
    }

    const continueButton = page.getByRole('button', { name: /Продолжить|Continue/i }).first()
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click()
    }
  }
}

test('electron launch smoke', async () => {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'linka-type-smoke-'))
  let app: ElectronApplication | undefined

  try {
    app = await electron.launch({
      args: [
        path.join(process.cwd(), 'dist/electron/main.js'),
        `--user-data-dir=${userDataDir}`,
        ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
      ],
      env: {
        ...noProxyEnv,
        VITE_DEV_SERVER_URL: devServerUrl,
      },
    })

    const page = await app.firstWindow()
    const bounds = await setWindowSize(app, 640, 480)
    expect(bounds).toMatchObject({ width: 640, height: 480 })
    const consoleWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (/warn|error/i.test(msg.type()) || text.includes('inject() can only be used inside setup')) {
        consoleWarnings.push(text)
      }
    })

    await expect
      .poll(() => page.url(), { timeout: 30_000 })
      .toContain(devServerUrl)
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveTitle(/LINKa/)

    await resetModeSelection(page)
    await continueInOfflineMode(page)
    await expect(page).toHaveURL(/#\/main/, { timeout: 20_000 })
    await expectNoHorizontalOverflow(page)

    await page.getByRole('tab', { name: 'Быстрые' }).click()
    await expect(page.getByRole('region', { name: 'Быстрые фразы' })).toBeVisible()
    await page.getByRole('tab', { name: 'Банк' }).click()
    await expect(page.getByRole('region', { name: 'Список категорий' })).toBeVisible()
    await page.getByRole('tab', { name: 'Ввод' }).click()

    const mainInput = page.getByRole('textbox', { name: 'Введите текст для озвучивания...' })
    await mainInput.fill('Smoke test: electron click flow')
    await expect(mainInput).toHaveValue('Smoke test: electron click flow')

    await page.getByRole('button', { name: 'Очистить' }).click()
    await expect(mainInput).toHaveValue('')

    await page.getByRole('button', { name: /Открыть меню|Open menu|a11y\.menuButton/ }).click()
    await page.getByRole('link', { name: /Настройки|Settings|nav\.settings/ }).click()
    await expect(page).toHaveURL(/#\/settings/, { timeout: 15_000 })
    await expectNoHorizontalOverflow(page)
    await expect(page.getByText('Настройки').first()).toBeVisible()
    await expect(page.getByText('nav.backToMain')).toHaveCount(0)
    await expect(page.getByText('settings.voiceSettings.cache.title')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    const voiceSelect = page.getByRole('combobox', { name: /Выберите голос|Select voice/i }).first()
    await expect(voiceSelect).toBeVisible()

    const backToMain = page.getByRole('button', { name: /На главную|Back to main/i }).first()
    await backToMain.click()
    await expect(page).toHaveURL(/#\/main/, { timeout: 15_000 })

    await page.getByRole('button', { name: /Открыть меню|Open menu|a11y\.menuButton/ }).click()
    await page.getByRole('link', { name: /Диалог|Chat|nav\.chat/ }).click()
    await expect(page).toHaveURL(/#\/chat/, { timeout: 15_000 })

    await expect(page.getByRole('button', { name: 'Новый чат' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    expect(
      consoleWarnings.some((line) => line.includes('inject() can only be used inside setup')),
    ).toBeFalsy()
  } finally {
    await app?.close()
    await rm(userDataDir, { recursive: true, force: true })
  }
})
