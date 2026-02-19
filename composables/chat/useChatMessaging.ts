import type { Ref } from 'vue'
import type { DialogMessage } from '~/types/api'
import { useTTS } from '~/composables/useTTS'
import { useTypeSound } from '~/composables/useTypeSound'
import type { ChatSuggestion } from './types'

type ChatMessagingOptions = {
  activeChatId: Ref<string | null>
  messages: Ref<DialogMessage[]>
  quickSuggestions: Ref<ChatSuggestion[]>
  error: Ref<string | null>
  updateActiveChatMeta: (timestamp: number) => void
  loadChatSuggestions: (chatId: string) => Promise<boolean>
}

export const useChatMessaging = (options: ChatMessagingOptions) => {
  const { t } = useI18n()
  const { api } = useAppServices()
  const { speak, stop, isPlaying } = useTTS()
  const { handleTextInput } = useTypeSound()

  const inputText = ref('')
  const isSending = ref(false)

  const sendTypedMessage = async (): Promise<boolean> => {
    if (!options.activeChatId.value) return false

    const text = inputText.value.trim()
    if (!text || isSending.value) return false

    isSending.value = true
    options.error.value = null

    try {
      if (isPlaying.value) {
        stop()
      }
      void speak(text)

      const result = await api.dialog.createMessage(options.activeChatId.value, {
        role: 'disabled_person',
        content: text,
        source: 'typed',
        created: Date.now(),
      })

      options.messages.value.push(result.message)
      options.updateActiveChatMeta(result.message.created)
      inputText.value = ''
      return true
    } catch (err: unknown) {
      const failure = err as Error
      options.error.value = failure.message || t('chat.errors.sendMessage')
      return false
    } finally {
      isSending.value = false
    }
  }

  const resolveSuggestionId = async (text: string): Promise<string | null> => {
    if (!options.activeChatId.value) return null

    try {
      const pendingSuggestions = await api.dialog.listSuggestions('pending', 200)
      const match = pendingSuggestions.find(
        suggestion =>
          suggestion.chatId === options.activeChatId.value
          && suggestion.text === text,
      )
      return match?.id ?? null
    } catch (err: unknown) {
      console.error('Failed to resolve suggestion id:', err)
      return null
    }
  }

  const dismissSuggestion = async (suggestion: ChatSuggestion) => {
    const hadId = Boolean(suggestion.id)
    const suggestionId = suggestion.id ?? (await resolveSuggestionId(suggestion.text))
    if (!suggestionId) return

    try {
      await api.dialog.dismissSuggestions([suggestionId])
      options.quickSuggestions.value = options.quickSuggestions.value.filter(item => {
        if (hadId) return item.id !== suggestionId
        return item.text !== suggestion.text
      })
    } catch (err: unknown) {
      console.error('Failed to dismiss suggestion:', err)
    }
  }

  const sendSuggestion = async (suggestion: ChatSuggestion) => {
    inputText.value = suggestion.text
    await nextTick()
    const sent = await sendTypedMessage()
    if (sent) {
      await dismissSuggestion(suggestion)
    }
  }

  const sendAudioMessage = async (blob: Blob, mimeType: string) => {
    if (!options.activeChatId.value) return

    isSending.value = true
    options.error.value = null

    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm'
    const filename = `recording-${Date.now()}.${ext}`

    try {
      const result = await api.dialog.createMessageWithAudio(
        options.activeChatId.value,
        {
          role: 'speaker',
          content: '',
          source: 'audio',
          includeSuggestions: true,
          created: Date.now(),
        },
        blob,
        filename,
      )

      options.messages.value.push(result.message)
      options.updateActiveChatMeta(result.message.created)

      const loaded = await options.loadChatSuggestions(options.activeChatId.value)
      if (!loaded && result.suggestions?.length) {
        options.quickSuggestions.value = result.suggestions.map(text => ({ text }))
      }
    } catch (err: unknown) {
      const failure = err as Error
      options.error.value = failure.message || t('chat.errors.sendAudio')
    } finally {
      isSending.value = false
    }
  }

  const selectSuggestion = (index: number) => {
    if (index >= 0 && index < options.quickSuggestions.value.length) {
      void sendSuggestion(options.quickSuggestions.value[index])
    }
  }

  const clearInput = () => {
    inputText.value = ''
  }

  watch(inputText, (value, oldValue) => {
    handleTextInput(value, oldValue)
  })

  return {
    inputText,
    isSending,
    isPlaying,
    stop,
    sendTypedMessage,
    sendAudioMessage,
    sendSuggestion,
    selectSuggestion,
    clearInput,
  }
}
