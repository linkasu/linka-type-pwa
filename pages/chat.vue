<script setup lang="ts">
import { useTTS } from '~/composables/useTTS'
import { useTypeSound } from '~/composables/useTypeSound'
import { useChatKeyboard } from '~/composables/useChatKeyboard'
import type { DialogChat, DialogMessage } from '~/types/api'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'setup'],
})

const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const { speak, stop, isPlaying } = useTTS()
const { handleTextInput } = useTypeSound()

const chats = ref<DialogChat[]>([])
const activeChatId = ref<string | null>(null)
const messages = ref<DialogMessage[]>([])
const quickSuggestions = ref<string[]>([])

const isLoadingChats = ref(false)
const isLoadingMessages = ref(false)
const isSending = ref(false)
const error = ref<string | null>(null)

const inputText = ref('')
const inputRef = ref<any>(null)
const messageListRef = ref<HTMLElement | null>(null)

const isRecording = ref(false)
const recordingError = ref<string | null>(null)
const recordingDuration = ref(0)
const recordingMimeType = ref('')
let recorder: MediaRecorder | null = null
let recorderStream: MediaStream | null = null
let recorderChunks: Blob[] = []
let recordingTimer: number | null = null
let shouldSendRecording = true

const focusInput = () => {
  const target = inputRef.value
  if (!target) return
  if (typeof target.focus === 'function') {
    target.focus()
    return
  }
  const el = target.$el?.querySelector?.('textarea') as HTMLTextAreaElement | undefined
  el?.focus()
}

const formatTime = (timestamp: number) => {
  const value = new Date(timestamp)
  return value.toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const sortChats = (list: DialogChat[]) =>
  [...list].sort((a, b) => {
    const aTime = a.updatedAt ?? a.lastMessageAt ?? a.created
    const bTime = b.updatedAt ?? b.lastMessageAt ?? b.created
    return bTime - aTime
  })

const loadChats = async () => {
  isLoadingChats.value = true
  error.value = null
  try {
    const list = await $api.dialog.listChats()
    const sorted = sortChats(list)
    chats.value = sorted
    if (!sorted.length) {
      const created = await $api.dialog.createChat({})
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

const loadMessages = async (chatId: string) => {
  isLoadingMessages.value = true
  error.value = null
  try {
    const list = await $api.dialog.listMessages(chatId, { limit: 200 })
    messages.value = list
    quickSuggestions.value = []
    await nextTick()
    scrollToBottom()
  } catch (err: unknown) {
    const failure = err as Error
    error.value = failure.message || t('chat.errors.loadMessages')
  } finally {
    isLoadingMessages.value = false
  }
}

const scrollToBottom = () => {
  if (!messageListRef.value) return
  messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const updateActiveChatMeta = (timestamp: number) => {
  if (!activeChatId.value) return
  const index = chats.value.findIndex(chat => chat.id === activeChatId.value)
  if (index === -1) return
  const chat = chats.value[index]
  const updated = {
    ...chat,
    lastMessageAt: timestamp,
    updatedAt: Date.now(),
    messageCount: (chat.messageCount ?? 0) + 1,
  }
  const next = [...chats.value]
  next.splice(index, 1, updated)
  chats.value = sortChats(next)
}

const createChat = async () => {
  try {
    const chat = await $api.dialog.createChat({})
    chats.value = sortChats([chat, ...chats.value])
    activeChatId.value = chat.id
  } catch (err: unknown) {
    const failure = err as Error
    error.value = failure.message || t('chat.errors.createChat')
  }
}

const deleteChat = async (chatId: string) => {
  try {
    await $api.dialog.deleteChat(chatId)
    chats.value = chats.value.filter(chat => chat.id !== chatId)
    if (activeChatId.value === chatId) {
      activeChatId.value = chats.value[0]?.id ?? null
      if (!activeChatId.value) {
        await createChat()
      }
    }
  } catch (err: unknown) {
    const failure = err as Error
    error.value = failure.message || t('chat.errors.deleteChat')
  }
}

const sendTypedMessage = async () => {
  if (!activeChatId.value) return
  const text = inputText.value.trim()
  if (!text) return
  if (isSending.value) return

  isSending.value = true
  error.value = null

  try {
    if (isPlaying.value) {
      stop()
    }
    void speak(text)
    const result = await $api.dialog.createMessage(activeChatId.value, {
      role: 'disabled_person',
      content: text,
      source: 'typed',
      created: Date.now(),
    })
    messages.value.push(result.message)
    updateActiveChatMeta(result.message.created)
    inputText.value = ''
    quickSuggestions.value = []
    await nextTick()
    scrollToBottom()
  } catch (err: unknown) {
    const failure = err as Error
    error.value = failure.message || t('chat.errors.sendMessage')
  } finally {
    isSending.value = false
  }
}

const sendSuggestion = async (text: string) => {
  inputText.value = text
  await nextTick()
  await sendTypedMessage()
}

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  return types.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
}

const stopStream = () => {
  recorderStream?.getTracks().forEach(track => track.stop())
  recorderStream = null
}

const startRecordingTimer = () => {
  recordingDuration.value = 0
  const start = Date.now()
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  recordingTimer = window.setInterval(() => {
    recordingDuration.value = Date.now() - start
  }, 500)
}

const stopRecordingTimer = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

const startRecording = async () => {
  if (isRecording.value || isSending.value) return
  if (!navigator.mediaDevices?.getUserMedia) {
    recordingError.value = t('chat.errors.micUnsupported')
    return
  }

  recordingError.value = null
  shouldSendRecording = true

  try {
    recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordingMimeType.value = pickMimeType()
    const options = recordingMimeType.value ? { mimeType: recordingMimeType.value } : undefined
    recorder = new MediaRecorder(recorderStream, options)
    recorderChunks = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recorderChunks.push(event.data)
      }
    }

    recorder.onstop = async () => {
      const recorderInstance = recorder
      stopStream()
      stopRecordingTimer()
      isRecording.value = false
      recorder = null

      if (!shouldSendRecording) {
        recorderChunks = []
        return
      }

      const type = recorderInstance?.mimeType || recordingMimeType.value || 'audio/webm'
      const blob = new Blob(recorderChunks, { type })
      recorderChunks = []
      if (!blob.size) {
        return
      }
      await sendAudioMessage(blob, type)
    }

    recorder.start()
    isRecording.value = true
    startRecordingTimer()
  } catch (err: unknown) {
    stopStream()
    const failure = err as Error
    recordingError.value = failure.message || t('chat.errors.micDenied')
  }
}

const stopRecording = (send = true) => {
  if (!recorder || recorder.state !== 'recording') return
  shouldSendRecording = send
  recorder.stop()
}

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording(true)
  } else {
    void startRecording()
  }
}

const stopRecordingAndDiscard = () => {
  if (isRecording.value) {
    stopRecording(false)
  }
}

const sendAudioMessage = async (blob: Blob, mimeType: string) => {
  if (!activeChatId.value) return
  isSending.value = true
  error.value = null

  const ext = mimeType.includes('ogg')
    ? 'ogg'
    : mimeType.includes('wav')
      ? 'wav'
      : 'webm'
  const filename = `recording-${Date.now()}.${ext}`

  try {
    const result = await $api.dialog.createMessageWithAudio(
      activeChatId.value,
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
    messages.value.push(result.message)
    updateActiveChatMeta(result.message.created)
    quickSuggestions.value = result.suggestions ?? []
    await nextTick()
    scrollToBottom()
  } catch (err: unknown) {
    const failure = err as Error
    error.value = failure.message || t('chat.errors.sendAudio')
  } finally {
    isSending.value = false
  }
}

watch(activeChatId, (chatId) => {
  if (chatId) {
    void loadMessages(chatId)
  } else {
    messages.value = []
  }
})

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)

watch(inputText, (value, oldValue) => {
  handleTextInput(value, oldValue)
})

useChatKeyboard({
  onFocusInput: focusInput,
  onToggleRecording: toggleRecording,
  onNewChat: createChat,
  onStopRecording: stopRecordingAndDiscard,
})

onMounted(async () => {
  await loadChats()
})

onUnmounted(() => {
  stopRecordingAndDiscard()
  stopStream()
  stopRecordingTimer()
})
</script>

<template>
  <VContainer
    fluid
    class="pa-4 chat-page"
  >
    <VRow>
      <VCol
        cols="12"
        md="4"
        lg="3"
      >
        <VCard class="chat-list">
          <VCardTitle class="d-flex align-center">
            {{ t('chat.chatsTitle') }}
            <VSpacer />
            <VBtn
              icon
              variant="text"
              :aria-label="t('chat.newChat')"
              @click="createChat"
            >
              <VIcon>mdi-plus</VIcon>
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText class="chat-list-body">
            <VProgressCircular
              v-if="isLoadingChats"
              indeterminate
              color="primary"
              size="32"
              class="my-4"
            />

            <VList
              v-else
              nav
              density="comfortable"
              class="chat-list-items"
            >
              <VListItem
                v-for="chat in chats"
                :key="chat.id"
                :active="chat.id === activeChatId"
                @click="activeChatId = chat.id"
              >
                <VListItemTitle>{{ chat.title || t('chat.untitled') }}</VListItemTitle>
                <VListItemSubtitle>
                  <span v-if="chat.lastMessageAt">
                    {{ formatTime(chat.lastMessageAt) }}
                  </span>
                  <span v-else>
                    {{ t('chat.emptyChat') }}
                  </span>
                </VListItemSubtitle>
                <template #append>
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    :aria-label="t('actions.delete')"
                    @click.stop="deleteChat(chat.id)"
                  >
                    <VIcon>mdi-trash-can-outline</VIcon>
                  </VBtn>
                </template>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="8"
        lg="9"
      >
        <VCard class="chat-panel">
          <VCardTitle class="d-flex align-center">
            <div>
              {{ chats.find(chat => chat.id === activeChatId)?.title || t('chat.title') }}
            </div>
            <VSpacer />
            <VChip
              v-if="activeChatId"
              size="small"
              variant="flat"
              color="primary"
            >
              {{ messages.length }}
            </VChip>
          </VCardTitle>

          <VDivider />

          <div class="chat-body">
            <div
              v-if="error"
              class="text-error text-caption mb-2"
            >
              {{ error }}
            </div>

            <div
              v-if="isLoadingMessages"
              class="chat-loading"
            >
              <VProgressCircular
                indeterminate
                color="primary"
              />
              <span class="ml-2">{{ t('status.loading') }}</span>
            </div>

            <div
              v-else
              ref="messageListRef"
              class="chat-messages"
            >
              <div
                v-if="!messages.length"
                class="text-medium-emphasis"
              >
                {{ t('chat.empty') }}
              </div>

              <div
                v-for="message in messages"
                :key="message.id"
                class="chat-message"
                :class="message.role === 'disabled_person' ? 'is-user' : 'is-speaker'"
              >
                <div class="message-meta">
                  <span class="message-role">
                    {{ message.role === 'disabled_person' ? t('chat.you') : t('chat.speaker') }}
                  </span>
                  <span class="message-time">{{ formatTime(message.created) }}</span>
                </div>
                <div class="message-bubble">
                  {{ message.content }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="quickSuggestions.length"
            class="chat-suggestions"
          >
            <div class="text-caption text-medium-emphasis mb-2">
              {{ t('chat.suggestions') }}
            </div>
            <div class="suggestion-chips">
              <VChip
                v-for="(suggestion, index) in quickSuggestions"
                :key="`${suggestion}-${index}`"
                class="suggestion-chip"
                variant="outlined"
                @click="sendSuggestion(suggestion)"
              >
                {{ suggestion }}
              </VChip>
            </div>
          </div>

          <VDivider />

          <div class="chat-input">
            <VTextarea
              ref="inputRef"
              v-model="inputText"
              :placeholder="t('chat.placeholder')"
              rows="3"
              auto-grow
              :aria-label="t('chat.placeholder')"
              @keydown.enter.exact.prevent="sendTypedMessage"
              @keydown.enter.ctrl="inputText += '\n'"
              @keydown.enter.meta="inputText += '\n'"
            />

            <div class="chat-actions">
              <VBtn
                color="primary"
                size="large"
                :disabled="!inputText.trim() || isSending"
                @click="sendTypedMessage"
              >
                {{ t('chat.send') }}
              </VBtn>

              <VBtn
                :color="isRecording ? 'error' : 'secondary'"
                size="large"
                :loading="isSending"
                @click="toggleRecording"
              >
                <VIcon start>
                  {{ isRecording ? 'mdi-stop-circle-outline' : 'mdi-microphone' }}
                </VIcon>
                {{ isRecording ? t('chat.stopRecord') : t('chat.record') }}
              </VBtn>

              <VBtn
                variant="outlined"
                size="large"
                icon
                :aria-label="t('chat.clear')"
                @click="inputText = ''"
              >
                <VIcon>mdi-delete</VIcon>
              </VBtn>

              <VBtn
                variant="outlined"
                size="large"
                icon
                :aria-label="t('chat.stopSpeech')"
                :disabled="!isPlaying"
                @click="stop"
              >
                <VIcon>mdi-stop</VIcon>
              </VBtn>
            </div>

            <div
              v-if="isRecording"
              class="recording-indicator"
            >
              <VIcon color="error">mdi-record</VIcon>
              <span>{{ t('chat.recording') }}</span>
              <span class="recording-time">{{ formatDuration(recordingDuration) }}</span>
            </div>

            <div
              v-if="recordingError"
              class="text-error text-caption mt-2"
            >
              {{ recordingError }}
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.chat-page {
  min-height: calc(100vh - 64px);
}

.chat-list-body {
  max-height: 70vh;
  overflow-y: auto;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.chat-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.chat-message {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-message.is-user {
  align-items: flex-end;
}

.chat-message.is-speaker {
  align-items: flex-start;
}

.message-meta {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.message-bubble {
  max-width: min(85%, 520px);
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.7);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  white-space: pre-wrap;
}

.chat-message.is-user .message-bubble {
  background: rgba(var(--v-theme-primary), 0.15);
}

.chat-suggestions {
  padding: 12px 16px 4px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  cursor: pointer;
}

.chat-input {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.recording-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.recording-time {
  font-variant-numeric: tabular-nums;
}

.chat-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
@media (max-width: 959px) {
  .chat-list-body {
    max-height: 40vh;
  }
}
</style>
