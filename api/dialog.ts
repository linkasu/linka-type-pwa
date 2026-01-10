import { getApiClient } from './client'
import type {
  CreateDialogChatRequest,
  CreateDialogMessageRequest,
  DialogChat,
  DialogMessage,
  DialogMessageResult,
  DialogSuggestion,
  DialogSuggestionApplyItem,
  DialogSuggestionApplyResult,
} from '~/types/api'

export interface ListDialogMessagesOptions {
  limit?: number
  before?: number
}

type RawDialogChat = DialogChat & {
  updated_at?: number
  last_message_at?: number
  message_count?: number
}

type RawDialogMessage = DialogMessage & {
  updated_at?: number
}

type RawDialogSuggestion = DialogSuggestion & {
  updated_at?: number
}

type RawDialogMessageResult = DialogMessageResult & {
  message: RawDialogMessage
}

const normalizeDialogChat = (raw: RawDialogChat): DialogChat => ({
  id: raw.id ?? '',
  title: raw.title ?? '',
  created: raw.created ?? 0,
  updatedAt: raw.updatedAt ?? raw.updated_at,
  lastMessageAt: raw.lastMessageAt ?? raw.last_message_at,
  messageCount: raw.messageCount ?? raw.message_count,
})

const normalizeDialogMessage = (raw: RawDialogMessage): DialogMessage => ({
  id: raw.id ?? '',
  chatId: raw.chatId ?? '',
  role: raw.role ?? 'speaker',
  content: raw.content ?? '',
  source: raw.source,
  created: raw.created ?? 0,
  updatedAt: raw.updatedAt ?? raw.updated_at,
})

const normalizeDialogSuggestion = (raw: RawDialogSuggestion): DialogSuggestion => ({
  id: raw.id ?? '',
  chatId: raw.chatId,
  messageId: raw.messageId,
  text: raw.text ?? '',
  status: raw.status ?? 'pending',
  categoryId: raw.categoryId,
  created: raw.created ?? 0,
  updatedAt: raw.updatedAt ?? raw.updated_at,
})

const normalizeDialogMessageResult = (raw: RawDialogMessageResult): DialogMessageResult => ({
  message: normalizeDialogMessage(raw.message),
  suggestions: raw.suggestions,
  transcript: raw.transcript ?? undefined,
})

const toAudioFile = (audio: Blob, filename?: string): File => {
  if (audio instanceof File) return audio
  const type = audio.type || 'audio/webm'
  const ext = type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm'
  return new File([audio], filename ?? `recording-${Date.now()}.${ext}`, { type })
}

export const dialogApi = {
  async listChats(): Promise<DialogChat[]> {
    const client = getApiClient()
    const response = await client.get<RawDialogChat[]>('/dialog/chats')
    return response.data.map(normalizeDialogChat)
  },

  async createChat(data: CreateDialogChatRequest = {}): Promise<DialogChat> {
    const client = getApiClient()
    const response = await client.post<RawDialogChat>('/dialog/chats', data)
    return normalizeDialogChat(response.data)
  },

  async deleteChat(id: string): Promise<void> {
    const client = getApiClient()
    await client.delete(`/dialog/chats/${id}`)
  },

  async listMessages(
    chatId: string,
    options: ListDialogMessagesOptions = {},
  ): Promise<DialogMessage[]> {
    const client = getApiClient()
    const response = await client.get<RawDialogMessage[]>(
      `/dialog/chats/${chatId}/messages`,
      { params: options },
    )
    return response.data.map(normalizeDialogMessage).reverse()
  },

  async createMessage(
    chatId: string,
    payload: CreateDialogMessageRequest,
  ): Promise<DialogMessageResult> {
    const client = getApiClient()
    const response = await client.post<RawDialogMessageResult>(
      `/dialog/chats/${chatId}/messages`,
      payload,
    )
    return normalizeDialogMessageResult(response.data)
  },

  async createMessageWithAudio(
    chatId: string,
    payload: CreateDialogMessageRequest,
    audio: Blob,
    filename?: string,
  ): Promise<DialogMessageResult> {
    const client = getApiClient()
    const file = toAudioFile(audio, filename)
    const response = await client.postForm<RawDialogMessageResult>(
      `/dialog/chats/${chatId}/messages`,
      {
        payload: JSON.stringify(payload),
        audio: file,
      },
    )
    return normalizeDialogMessageResult(response.data)
  },

  async listSuggestions(status = 'pending', limit = 200): Promise<DialogSuggestion[]> {
    const client = getApiClient()
    const response = await client.get<RawDialogSuggestion[]>('/dialog/suggestions', {
      params: { status, limit },
    })
    return response.data.map(normalizeDialogSuggestion)
  },

  async applySuggestions(items: DialogSuggestionApplyItem[]): Promise<DialogSuggestionApplyResult> {
    const client = getApiClient()
    const response = await client.post<DialogSuggestionApplyResult>(
      '/dialog/suggestions/apply',
      { items },
    )
    return response.data
  },

  async dismissSuggestions(ids: string[]): Promise<void> {
    const client = getApiClient()
    await client.post('/dialog/suggestions/dismiss', { ids })
  },
}
