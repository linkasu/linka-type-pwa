import { expect, type Page } from '@playwright/test'

export async function expectWordSpeech(page: Page) {
  await page.goto(`${page.url().split('#')[0]}#/settings`)
  await page.getByLabel('Использовать онлайн TTS (Яндекс, Sber)', { exact: true }).uncheck()
  await page.getByRole('tab', { name: 'Адаптивность' }).click()
  await page.getByLabel('Озвучивать последнее слово', { exact: true }).check()
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem('linka_settings') || '{}').speakLastWord,
  )).toBe(true)
  await page.reload()
  await page.getByRole('tab', { name: 'Адаптивность' }).click()
  await expect(page.getByLabel('Озвучивать последнее слово', { exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'На главную' }).first().click()

  await page.evaluate(() => {
    sessionStorage.setItem('test:spokenWords', '[]')
    speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      const words: string[] = JSON.parse(sessionStorage.getItem('test:spokenWords') || '[]')
      words.push(utterance.text)
      sessionStorage.setItem('test:spokenWords', JSON.stringify(words))
    }
  })
  const spokenWords = () => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('test:spokenWords') || '[]') as string[],
  )
  const input = page.getByRole('textbox', { name: 'Введите текст для озвучивания...' })
  await input.fill('Привет')
  expect(await spokenWords()).toEqual([])
  await input.press('Space')
  await expect.poll(spokenWords).toEqual(['Привет'])
  await input.press('Space')
  await input.pressSequentially('мир ')
  await expect.poll(spokenWords).toEqual(['Привет', 'мир'])
  await input.pressSequentially('ещё')
  await input.press('Backspace')
  await input.press('Backspace')
  await input.press('Backspace')
  expect(await spokenWords()).toEqual(['Привет', 'мир'])

  await page.getByRole('button', { name: 'Чат 2', exact: true }).click()
  await expect(input).toHaveValue('')
  await page.getByRole('button', { name: 'Чат 1', exact: true }).click()
  await expect(input).toHaveValue('Привет  мир ')
  expect(await spokenWords()).toEqual(['Привет', 'мир'])

  await page.getByRole('button', { name: 'Режим фокуса' }).click()
  const spotlight = page.locator('textarea.spotlight-textarea')
  await spotlight.fill('фокус')
  await spotlight.press('Space')
  await expect.poll(spokenWords).toEqual(['Привет', 'мир', 'фокус'])
  await spotlight.press('Escape')

  await page.getByRole('button', { name: 'Открыть меню' }).click()
  await page.getByRole('link', { name: 'Настройки', exact: true }).click()
  await page.getByRole('tab', { name: 'Адаптивность' }).click()
  await page.getByLabel('Озвучивать последнее слово', { exact: true }).uncheck()
  await page.getByRole('button', { name: 'На главную' }).first().click()
  await input.fill('Тихо')
  await input.press('Space')
  expect(await spokenWords()).toEqual(['Привет', 'мир', 'фокус'])
  await page.getByRole('button', { name: 'Очистить', exact: true }).click()
}
