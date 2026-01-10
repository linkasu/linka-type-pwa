// API Types for backend.linka.su

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
  statementsCount?: number
}

export interface GlobalCategory extends Category {
  statements?: Statement[]
}

export interface Statement {
  id: string
  categoryId: string
  text: string
  created: number
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

export interface RealtimeChange {
  type: ChangeType
  data: Category | Statement | QuickPhrase | UserState
  timestamp: number
}

export interface ChangesResponse {
  type: 'changes'
  cursor: string
  changes: RealtimeChange[]
}

export interface ApiError {
  error: {
    code: ErrorCode
    message: string
  }
}

export type ChangeType =
  | 'category_added'
  | 'category_updated'
  | 'category_deleted'
  | 'statement_added'
  | 'statement_updated'
  | 'statement_deleted'
  | 'quickes_updated'
  | 'user_state_updated'

export type ErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'validation_error'
  | 'conflict'
  | 'internal_error'

// Request types
export interface LoginRequest {
  email: string
  password: string
}

export interface CreateCategoryRequest {
  label: string
  created?: number
}

export interface UpdateCategoryRequest {
  label: string
}

export interface CreateStatementRequest {
  categoryId: string
  text: string
  created?: number
}

export interface UpdateStatementRequest {
  text: string
}

export interface UpdateQuickesRequest {
  quickes: string[]
}

export interface UpdateUserStateRequest {
  inited?: boolean
  preferences?: Partial<UserPreferences>
}

export interface ImportCategoryRequest {
  categoryId: string
  force?: boolean
}

export interface OnboardingRequest {
  answers: Record<string, string>
}

export interface TTSRequest {
  text: string
  voice: string
  speed?: number
}

export interface DeleteAccountRequest {
  deleteFirebase?: boolean
}

// Predictor API
export interface PredictorResponse {
  endOfWord: boolean
  pos: number
  text: string[]
}
