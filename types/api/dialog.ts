export interface DialogChat {
  id: string
  title: string
  created: number
  updatedAt?: number
  lastMessageAt?: number
  messageCount?: number
}

export interface DialogMessage {
  id: string
  chatId: string
  role: 'speaker' | 'disabled_person'
  content: string
  source?: string
  created: number
  updatedAt?: number
}

export interface DialogMessageResult {
  message: DialogMessage
  suggestions?: string[]
  transcript?: string
}

export interface DialogSuggestion {
  id: string
  chatId?: string
  messageId?: string
  text: string
  status: 'pending' | 'accepted' | 'dismissed'
  categoryId?: string
  created: number
  updatedAt?: number
}

export interface DialogSuggestionApplyItem {
  id: string
  categoryId?: string
  categoryLabel?: string
}

export interface DialogSuggestionApplyResult {
  created: Array<{ categoryId: string; statementId: string }>
  applied: string[]
}
