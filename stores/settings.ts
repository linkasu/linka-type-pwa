import { defineStore } from 'pinia'
import { DEFAULT_PREFERENCES } from '~/types'
import type { UserPreferences } from '~/types/api'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { pickUserPreferences } from './settings/preferences'
import { schedulePreferenceSync } from './settings/sync'

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
    async initialize() {
      this.loadFromStorage()

      if (!import.meta.client) return

      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) return

      const userStore = useUserStore()
      if (userStore.inited === null) {
        try {
          await userStore.fetchState()
        } catch {
          return
        }
      }

      if (userStore.hasRemotePreferences) {
        this.applyUserPreferences(userStore.preferences)
      } else {
        this.queuePreferenceSync(pickUserPreferences(this.$state))
      }
    },

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

    applyUserPreferences(preferences: UserPreferences) {
      this.voiceUri = undefined
      this.yandexVoice = undefined
      Object.assign(this, { ...DEFAULT_PREFERENCES, ...preferences })
      this.saveToStorage()
    },

    saveToStorage() {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      }
    },

    updateSettings(settings: Partial<SettingsState>) {
      Object.assign(this, settings)
      this.saveToStorage()
      this.queuePreferenceSync(pickUserPreferences(settings))
    },

    toggleDarkTheme() {
      this.darkTheme = !this.darkTheme
      this.saveToStorage()
      this.queuePreferenceSync({ darkTheme: this.darkTheme })
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
      this.queuePreferenceSync(pickUserPreferences(settings))
    },

    setYandexTTS(enabled: boolean) {
      if (this.yandex === enabled) return

      this.yandex = enabled
      this.saveToStorage()
      this.queuePreferenceSync({ yandex: this.yandex })
    },

    toggleYandexTTS() {
      this.setYandexTTS(!this.yandex)
    },

    resetToDefaults() {
      Object.assign(this, { ...DEFAULT_PREFERENCES, locale: this.locale })
      this.voiceUri = undefined
      this.yandexVoice = undefined
      this.saveToStorage()
      this.queuePreferenceSync({ ...DEFAULT_PREFERENCES })
    },

    async queuePreferenceSync(preferences: Partial<UserPreferences>) {
      schedulePreferenceSync(preferences, useAuthStore(), useUserStore())
    },

    applySettingsPatch(patch: Partial<UserPreferences>) {
      Object.assign(this, patch)
      this.saveToStorage()
    },
  },
})
