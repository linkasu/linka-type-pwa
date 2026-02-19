import type { UserPreferences } from './entities'

export interface ResetPasswordRequest {
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateCategoryRequest {
  label: string
  created?: number
  aiUse?: boolean
}

export interface UpdateCategoryRequest {
  label: string
  aiUse?: boolean
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

export interface CreateDialogChatRequest {
  title?: string
}

export interface CreateDialogMessageRequest {
  role: 'speaker' | 'disabled_person'
  content: string
  source?: string
  created?: number
  includeSuggestions?: boolean
}
