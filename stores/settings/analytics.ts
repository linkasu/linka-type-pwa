import type { AnalyticsUserProperties } from '~/types/analytics'

export interface SettingsAnalyticsState {
  yandex: boolean
  voiceUri?: string
  yandexVoice?: string
  showPredictor: boolean
  showSpotlightPredictor: boolean
  showQuickes: boolean
  showBank: boolean
  speakLastWord: boolean
  saveOnSay: boolean
  typeSound: boolean
  darkTheme: boolean
  locale: 'ru' | 'en'
  volume: number
  rate: number
  pitch: number
}

export const buildAnalyticsUserProperties = (
  state: SettingsAnalyticsState,
  isPwa: () => boolean,
  detectPlatform: () => 'web' | 'ios' | 'android',
): Partial<AnalyticsUserProperties> => ({
  voice_engine: state.yandex ? 'yandex' : 'browser',
  voice_uri: state.voiceUri,
  yandex_voice: state.yandexVoice,
  show_predictor: state.showPredictor,
  show_spotlight_predictor: state.showSpotlightPredictor,
  show_quickes: state.showQuickes,
  show_bank: state.showBank,
  speak_last_word: state.speakLastWord,
  save_on_say: state.saveOnSay,
  type_sound: state.typeSound,
  dark_theme: state.darkTheme,
  locale: state.locale,
  volume: state.volume,
  rate: state.rate,
  pitch: state.pitch,
  is_pwa: isPwa(),
  platform: detectPlatform(),
})

export const trackSettingsPatch = (
  settings: Record<string, unknown>,
  trackSettingsChanged: (key: string, value: string | boolean | number) => void,
) => {
  for (const [key, value] of Object.entries(settings)) {
    if (
      value !== undefined
      && (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
    ) {
      trackSettingsChanged(key, value)
    }
  }
}
