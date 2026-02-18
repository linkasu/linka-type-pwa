import { createI18n } from 'vue-i18n'
import ru from '~/locales/ru.json'
import en from '~/locales/en.json'

const localeFromStorage = typeof window !== 'undefined'
  ? (localStorage.getItem('i18n_redirected') || 'ru')
  : 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: localeFromStorage,
  fallbackLocale: 'ru',
  messages: {
    ru,
    en,
  },
})
