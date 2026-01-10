export * from './api'

// App-specific types

export interface ChatState {
  text: string
  cursorPosition: number
}

export interface TTSState {
  isPlaying: boolean
  currentText: string
  voices: import('./api').Voice[]
  selectedVoice: import('./api').Voice | null
  volume: number
  rate: number
  pitch: number
  useYandex: boolean
}

export interface BankState {
  selectedCategoryId: string | null
  isPasteMode: boolean
  isReaderMode: boolean
  isTextEditorMode: boolean
}

export interface AppSettings {
  darkTheme: boolean
  showPredictor: boolean
  showSpotlightPredictor: boolean
  showQuickes: boolean
  showBank: boolean
  saveOnSay: boolean
  typeSound: boolean
  speakLastWord: boolean
  locale: 'ru' | 'en'
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  pendingChanges: number
}

// Keyboard shortcuts map
export const QWERTY_MAP = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
  'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
  'Z', 'X', 'C', 'V', 'B', 'N', 'M',
] as const

export type QwertyKey = (typeof QWERTY_MAP)[number]

// Default values
export const DEFAULT_QUICKES = [
  'Да',
  'Нет',
  'Спасибо',
  'Пожалуйста',
  'Помогите',
  'Подождите',
]

export const DEFAULT_PREFERENCES: import('./api').UserPreferences = {
  darkTheme: false,
  yandex: true,
  volume: 1,
  rate: 1,
  pitch: 1,
  showPredictor: true,
  showSpotlightPredictor: true,
  showQuickes: true,
  showBank: true,
  saveOnSay: false,
  typeSound: false,
  speakLastWord: false,
}
