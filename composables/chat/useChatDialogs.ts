import type { DialogChat, DialogMessage } from '~/types/api'
import type { ChatDialogsState, ChatSuggestion } from './types'

const sortChats = (list: DialogChat[]) =>
  [...list].sort((a, b) => {
    const aTime = a.updatedAt ?? a.lastMessageAt ?? a.created
    const bTime = b.updatedAt ?? b.lastMessageAt ?? b.created
    return bTime - aTime
  })

export const useChatDialogs = () => {
  const { t } = useI18n()
  const { api } = useAppServices()

  const chats = ref<DialogChat[]>([])
  const activeChatId = ref<string | null>(null)
  const messages = ref<DialogMessage[]>([])
  const quickSuggestions = ref<ChatSuggestion[]>([])

  const isLoadingChats = ref(false)
  const isLoadingMessages = ref(false)
  const error = ref<string | null>(null)

  const loadChats = async () => {
    isLoadingChats.value = true
    error.value = null

    try {
      const list = await api.dialog.listChats()
      const sorted = sortChats(list)
      chats.value = sorted

      if (!sorted.length) {
        const created = await api.dialog.createChat({})
        chats.value = [created]
        activeChatId.value = created.id
        return
      }

      if (!activeChatId.value || !sorted.find(chat => chat.id === activeChatId.value)) {
        activeChatId.value = sorted[0].id
      }
    } catch (err: unknown) {
      const failure = err as Error
      error.value = failure.message || t('chat.errors.loadChats')
    } finally {
      isLoadingChats.value = false
    }
  }

  const loadChatSuggestions = async (chatId: string): Promise<boolean> => {
    try {
      const pendingSuggestions = await api.dialog.listSuggestions('pending', 200)
      quickSuggestions.value = pendingSuggestions
        .filter(suggestion => suggestion.chatId === chatId)
        .map(suggestion => ({ id: suggestion.id, text: suggestion.text }))
        .slice(0, 5)
      return true
    } catch (err: unknown) {
      console.error('Failed to load suggestions:', err)
      quickSuggestions.value = []
      return false
    }
  }

  const loadMessages = async (chatId: string) => {
    isLoadingMessages.value = true
    error.value = null

    try {
      messages.value = await api.dialog.listMessages(chatId, { limit: 200 })
      await loadChatSuggestions(chatId)
    } catch (err: unknown) {
      const failure = err as Error
      error.value = failure.message || t('chat.errors.loadMessages')
    } finally {
      isLoadingMessages.value = false
    }
  }

  const updateActiveChatMeta = (timestamp: number) => {
    if (!activeChatId.value) return

    const index = chats.value.findIndex(chat => chat.id === activeChatId.value)
    if (index === -1) return

    const chat = chats.value[index]
    const next = [...chats.value]
    next.splice(index, 1, {
      ...chat,
      lastMessageAt: timestamp,
      updatedAt: Date.now(),
      messageCount: (chat.messageCount ?? 0) + 1,
    })
    chats.value = sortChats(next)
  }

  const createChat = async () => {
    try {
      const chat = await api.dialog.createChat({})
      chats.value = sortChats([chat, ...chats.value])
      activeChatId.value = chat.id
    } catch (err: unknown) {
      const failure = err as Error
      error.value = failure.message || t('chat.errors.createChat')
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      await api.dialog.deleteChat(chatId)
      chats.value = chats.value.filter(chat => chat.id !== chatId)

      if (activeChatId.value !== chatId) return
      activeChatId.value = chats.value[0]?.id ?? null
      if (!activeChatId.value) {
        await createChat()
      }
    } catch (err: unknown) {
      const failure = err as Error
      error.value = failure.message || t('chat.errors.deleteChat')
    }
  }

  watch(activeChatId, (chatId) => {
    if (!chatId) {
      messages.value = []
      quickSuggestions.value = []
      return
    }

    void loadMessages(chatId)
  })

  return {
    chats,
    activeChatId,
    messages,
    quickSuggestions,
    isLoadingChats,
    isLoadingMessages,
    error,
    loadChats,
    loadChatSuggestions,
    updateActiveChatMeta,
    createChat,
    deleteChat,
  } satisfies ChatDialogsState & {
    loadChats: () => Promise<void>
    loadChatSuggestions: (chatId: string) => Promise<boolean>
    updateActiveChatMeta: (timestamp: number) => void
    createChat: () => Promise<void>
    deleteChat: (chatId: string) => Promise<void>
  }
}
