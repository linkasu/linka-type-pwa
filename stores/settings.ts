import { defineStore } from 'pinia'
import { DEFAULT_PREFERENCES } from '~/types'
import type { UserPreferences } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { addQueueItem } from '~/utils/offlineDb'
import { isOffline, shouldQueueOffline } from '~/utils/offline'
import { useAnalytics } from '~/composables/useAnalytics'

interface SettingsState extends UserPreferences {
  locale: 'ru' | 'en'
}

const STORAGE_KEY = 'linka_settings'
const SYNC_DEBOUNCE_MS = 800

const PREFERENCE_KEYS: Array<keyof UserPreferences> = [
  'darkTheme',
  'yandex',
  'voiceUri',
  'yandexVoice',
  'volume',
  'rate',
  'pitch',
  'showPredictor',
  'showSpotlightPredictor',
  'showQuickes',
  'showBank',
  'saveOnSay',
  'typeSound',
  'speakLastWord',
]

let pendingSync: ReturnType<typeof setTimeout> | null = null
let pendingPatch: Partial<UserPreferences> = {}

const pickPreferences = (state: Partial<SettingsState>): Partial<UserPreferences> => {
  const patch: Partial<UserPreferences> = {}
  for (const key of PREFERENCE_KEYS) {
    if (state[key] !== undefined) {
      patch[key] = state[key] as UserPreferences[typeof key]
    }
  }
  return patch
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_PREFERENCES,
    locale: 'ru',
  }),

  actions: {
    async initialize() {
      this.loadFromStorage()

      if (!import.meta.client) return

      const { useAuthStore } = await import('./auth')
      const { useUserStore } = await import('./user')
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
        this.queuePreferenceSync(pickPreferences(this.$state))
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

      // Sync user properties after loading preferences
      if (import.meta.client) {
        this.syncAnalyticsUserProperties()
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
      this.queuePreferenceSync(pickPreferences(settings))

      // Track settings changes
      if (import.meta.client) {
        const { trackSettingsChanged, updateUserProperties } = useAnalytics()
        for (const [key, value] of Object.entries(settings)) {
          if (value !== undefined) {
            trackSettingsChanged(key, value as string | boolean | number)
          }
        }
        this.syncAnalyticsUserProperties()
      }
    },

    syncAnalyticsUserProperties() {
      if (!import.meta.client) return
      const { updateUserProperties, isPwa, detectPlatform } = useAnalytics()
      updateUserProperties({
        voice_engine: this.yandex ? 'yandex' : 'browser',
        voice_uri: this.voiceUri,
        yandex_voice: this.yandexVoice,
        show_predictor: this.showPredictor,
        show_spotlight_predictor: this.showSpotlightPredictor,
        show_quickes: this.showQuickes,
        show_bank: this.showBank,
        speak_last_word: this.speakLastWord,
        save_on_say: this.saveOnSay,
        type_sound: this.typeSound,
        dark_theme: this.darkTheme,
        locale: this.locale,
        volume: this.volume,
        rate: this.rate,
        pitch: this.pitch,
        is_pwa: isPwa(),
        platform: detectPlatform(),
      })
    },

    toggleDarkTheme() {
      this.darkTheme = !this.darkTheme
      this.saveToStorage()
      this.queuePreferenceSync({ darkTheme: this.darkTheme })

      if (import.meta.client) {
        const { trackSettingsChanged } = useAnalytics()
        trackSettingsChanged('darkTheme', this.darkTheme)
        this.syncAnalyticsUserProperties()
      }
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
      this.queuePreferenceSync(pickPreferences(settings))

      if (import.meta.client) {
        const { trackSettingsChanged } = useAnalytics()
        for (const [key, value] of Object.entries(settings)) {
          if (value !== undefined) {
            trackSettingsChanged(key, value as string | number)
          }
        }
        this.syncAnalyticsUserProperties()
      }
    },

    toggleYandexTTS() {
      this.yandex = !this.yandex
      this.saveToStorage()
      this.queuePreferenceSync({ yandex: this.yandex })

      if (import.meta.client) {
        const { trackSettingsChanged } = useAnalytics()
        trackSettingsChanged('yandex', this.yandex)
        this.syncAnalyticsUserProperties()
      }
    },

    resetToDefaults() {
      Object.assign(this, { ...DEFAULT_PREFERENCES, locale: this.locale })
      this.voiceUri = undefined
      this.yandexVoice = undefined
      this.saveToStorage()
      this.queuePreferenceSync({ ...DEFAULT_PREFERENCES })
    },

    async queuePreferenceSync(preferences: Partial<UserPreferences>) {
      if (!import.meta.client) return
      if (Object.keys(preferences).length === 0) return

      pendingPatch = { ...pendingPatch, ...preferences }
      if (pendingSync) return

      pendingSync = setTimeout(async () => {
        const patch = { ...pendingPatch }
        pendingPatch = {}
        pendingSync = null

        try {
          const { useAuthStore } = await import('./auth')
          const { useUserStore } = await import('./user')
          const authStore = useAuthStore()
          const userStore = useUserStore()

          if (!authStore.user?.id) return
          if (!authStore.isAuthenticated && !isOffline()) return
          if (isOffline()) {
            await addQueueItem({
              userId: authStore.user.id,
              op: 'user_prefs_update',
              payload: { preferences: patch },
              createdAt: Date.now(),
            } satisfies OfflineQueueItem)
            userStore.applyPreferencesPatch(patch)
            return
          }

          await userStore.updatePreferences(patch)
        } catch (err) {
          const { useAuthStore } = await import('./auth')
          const { useUserStore } = await import('./user')
          const authStore = useAuthStore()
          const userStore = useUserStore()

          if (shouldQueueOffline(err) && authStore.user?.id) {
            await addQueueItem({
              userId: authStore.user.id,
              op: 'user_prefs_update',
              payload: { preferences: patch },
              createdAt: Date.now(),
            } satisfies OfflineQueueItem)
            userStore.applyPreferencesPatch(patch)
            return
          }
          console.warn('Failed to sync preferences:', err)
        }
      }, SYNC_DEBOUNCE_MS)
    },

    applySettingsPatch(patch: Partial<UserPreferences>) {
      Object.assign(this, patch)
      this.saveToStorage()
    },
  },
})
