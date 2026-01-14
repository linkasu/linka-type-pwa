// Firebase Analytics event names
export type AnalyticsEventName =
  // V1 legacy events
  | 'predicator_use'
  | 'spotlight'
  | 'say'
  | 'quickes_say'
  | 'bank_cselect'
  | 'bank_sselect'
  // Auth events
  | 'login'
  | 'logout'
  | 'register'
  // PWA events
  | 'update_prompt_shown'
  | 'update_accepted'
  | 'mobile_app_prompt_shown'
  | 'mobile_app_link_clicked'
  | 'pwa_install_prompt'
  | 'pwa_installed'
  // Feature events
  | 'category_cache_started'
  | 'category_cache_completed'
  | 'settings_changed'
  | 'reader_mode_opened'
  | 'text_editor_opened'

// Event parameter types for type-safety
export interface AnalyticsEventParams {
  predicator_use: { word: string; position: number }
  spotlight: { action: 'open' | 'close' }
  say: { text_length: number; has_text: boolean; download?: boolean }
  quickes_say: { phrase: string; index: number }
  bank_cselect: { category_id: string; key?: string }
  bank_sselect: { statement_id: string; key?: string; is_paste: boolean }
  login: { method: 'email' }
  logout: Record<string, never>
  register: { method: 'email' }
  update_prompt_shown: Record<string, never>
  update_accepted: Record<string, never>
  mobile_app_prompt_shown: { platform: 'ios' | 'android' }
  mobile_app_link_clicked: { platform: 'ios' | 'android' }
  pwa_install_prompt: Record<string, never>
  pwa_installed: Record<string, never>
  category_cache_started: { category_id: string; phrase_count: number }
  category_cache_completed: { category_id: string; phrase_count: number }
  settings_changed: { setting: string; value: string | boolean | number }
  reader_mode_opened: { category_id: string; statement_count: number }
  text_editor_opened: { category_id: string }
}

// User properties matching settings store
export interface AnalyticsUserProperties {
  voice_engine: 'browser' | 'yandex'
  voice_uri?: string
  yandex_voice?: string
  show_predictor: boolean
  show_spotlight_predictor: boolean
  show_quickes: boolean
  show_bank: boolean
  speak_last_word: boolean
  save_on_say: boolean
  type_sound: boolean
  dark_theme: boolean
  locale: 'ru' | 'en'
  volume: number
  rate: number
  pitch: number
  is_pwa: boolean
  platform: 'web' | 'ios' | 'android'
}
