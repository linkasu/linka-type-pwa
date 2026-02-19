import type { DialogChat, DialogMessage } from '~/types/api'
import type { Ref } from 'vue'

export type ChatSuggestion = {
  id?: string
  text: string
}

export type ChatDialogsState = {
  chats: Ref<DialogChat[]>
  activeChatId: Ref<string | null>
  messages: Ref<DialogMessage[]>
  quickSuggestions: Ref<ChatSuggestion[]>
  isLoadingChats: Ref<boolean>
  isLoadingMessages: Ref<boolean>
  error: Ref<string | null>
}
