import { useI18n as useVueI18n } from 'vue-i18n'

export function useI18n() {
  const i18n = useVueI18n()

  const setLocale = (locale: string) => {
    i18n.locale.value = locale as never
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18n_redirected', locale)
    }
  }

  return {
    ...i18n,
    setLocale,
  }
}
