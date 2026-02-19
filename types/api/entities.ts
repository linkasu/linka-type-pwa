export interface User {
  id: string
  email: string
  createdAt?: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Category {
  id: string
  label: string
  created: number
  default: boolean
  aiUse: boolean
  statementsCount?: number
}

export interface Statement {
  id: string
  categoryId: string
  text: string
  created: number
}

export interface GlobalCategory extends Category {
  statements?: Statement[]
}

export type QuickPhrase = string[]

export interface UserState {
  inited: boolean
  preferences: UserPreferences
}

export interface UserPreferences {
  darkTheme: boolean
  yandex: boolean
  voiceUri?: string
  yandexVoice?: string
  volume: number
  rate: number
  pitch: number
  showPredictor: boolean
  showSpotlightPredictor: boolean
  showQuickes: boolean
  showBank: boolean
  saveOnSay: boolean
  typeSound: boolean
  speakLastWord: boolean
}

export interface Voice {
  id: string
  name: string
  lang: string
  gender: 'male' | 'female'
  engine: 'browser' | 'yandex' | 'sber'
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'select' | 'multiselect'
  options?: string[]
}

export interface OnboardingResult {
  categories: Array<{
    label: string
    statements: string[]
  }>
}
