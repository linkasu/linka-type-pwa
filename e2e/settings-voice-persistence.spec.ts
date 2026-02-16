import { expect, test } from '@playwright/test'

test('persists selected TTS mode and online voice after reload', async ({ page }) => {
  const user = { id: 'e2e-user', email: 'e2e@example.com' }

  await page.route('**/api/voices', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'alena', name: 'Alena', lang: 'ru', lang_code: 'ru-RU', gender: 'F', engine: 'yandex' },
        { id: 'jane', name: 'Jane', lang: 'ru', lang_code: 'ru-RU', gender: 'F', engine: 'sber' },
      ]),
    })
  })

  await page.addInitScript((storedUser) => {
    Object.defineProperty(Navigator.prototype, 'onLine', {
      configurable: true,
      get() {
        return false
      },
    })
    localStorage.setItem('linka_auth', JSON.stringify({ user: storedUser }))
  }, user)

  await page.goto('/settings')
  await expect(page.locator('#main-content .text-h5')).toHaveText('Настройки')

  const yandexSwitch = page.getByRole('checkbox', { name: 'Использовать онлайн TTS (Яндекс, Sber)' })
  await expect(yandexSwitch).toBeVisible()
  await yandexSwitch.check()
  await expect(yandexSwitch).toBeChecked()

  const voiceSelect = page.locator('.v-select').filter({ hasText: 'Выберите голос' }).first()
  await expect(voiceSelect).toBeVisible()
  await voiceSelect.click()
  await page.getByRole('option', { name: 'Jane (Sber, Ж)' }).click()
  await expect(voiceSelect).toContainText('Jane (Sber, Ж)')

  await page.reload()
  await expect(page.locator('#main-content .text-h5')).toHaveText('Настройки')

  await expect.poll(() => page.evaluate(() => {
    const value = localStorage.getItem('linka_settings')
    if (!value) return null
    return JSON.parse(value)
  })).toMatchObject({
    yandex: true,
    yandexVoice: 'jane',
  })

  await expect(page.locator('.v-select').filter({ hasText: 'Выберите голос' }).first()).toContainText('Jane')
})
