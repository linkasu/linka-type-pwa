import { defineStore } from 'pinia'
import { DEFAULT_PREFERENCES } from '~/types'
import type { UserPreferences } from '../types/api'

interface SettingsState extends UserPreferences {
  locale: 'ru' | 'en'
}

const STORAGE_KEY = 'linka_settings'

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_PREFERENCES,
    locale: 'ru',
  }),

  actions: {
    loadFromStorage() {
      if (import.meta.client) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            Object.assign(this, { ...DEFAULT_PREFERENCES, ...parsed })
          } catch {
            // Invalid JSON, use defaults
          }
        }
      }
    },

    saveToStorage() {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      }
    },

    updateSettings(settings: Partial<SettingsState>) {
      Object.assign(this, settings)
      this.saveToStorage()
    },

    toggleDarkTheme() {
      this.darkTheme = !this.darkTheme
      this.saveToStorage()
    },

    setLocale(locale: 'ru' | 'en') {
      this.locale = locale
      this.saveToStorage()
    },

    setVoiceSettings(settings: { volume?: number; rate?: number; pitch?: number; voiceUri?: string; yandexVoice?: string }) {
      if (settings.volume !== undefined) this.volume = settings.volume
      if (settings.rate !== undefined) this.rate = settings.rate
      if (settings.pitch !== undefined) this.pitch = settings.pitch
      if (settings.voiceUri !== undefined) this.voiceUri = settings.voiceUri
      if (settings.yandexVoice !== undefined) this.yandexVoice = settings.yandexVoice
      this.saveToStorage()
    },

    toggleYandexTTS() {
      this.yandex = !this.yandex
      this.saveToStorage()
    },

    resetToDefaults() {
      Object.assign(this, { ...DEFAULT_PREFERENCES, locale: this.locale })
      this.saveToStorage()
    },
  },
})

