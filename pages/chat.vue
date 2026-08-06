<script setup lang="ts">
import ChatComposer from '~/components/chat/ChatComposer.vue'
import ChatMessagesList from '~/components/chat/ChatMessagesList.vue'
import ChatSidebar from '~/components/chat/ChatSidebar.vue'
import ChatSuggestions from '~/components/chat/ChatSuggestions.vue'
import { useDisplay } from 'vuetify'
import { useAudioRecording } from '~/composables/chat/useAudioRecording'
import { useChatDialogs } from '~/composables/chat/useChatDialogs'
import { useChatKeyboard } from '~/composables/useChatKeyboard'
import { useChatMessaging } from '~/composables/chat/useChatMessaging'

const { t } = useI18n()
const { mdAndUp } = useDisplay()
const compactView = ref<'list' | 'conversation'>('list')

const {
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
} = useChatDialogs()

const {
  inputText,
  isSending,
  isPlaying,
  stop,
  sendTypedMessage,
  sendAudioMessage,
  sendSuggestion,
  selectSuggestion,
  clearInput,
} = useChatMessaging({
  activeChatId,
  messages,
  quickSuggestions,
  error,
  updateActiveChatMeta,
  loadChatSuggestions,
})

const {
  isRecording,
  recordingError,
  recordingDuration,
  startRecording,
  stopRecording,
  toggleRecording,
  stopRecordingAndDiscard,
} = useAudioRecording({
  t: (key: string) => t(key),
  isBusy: isSending,
  onRecordingReady: sendAudioMessage,
})

useChatKeyboard({
  onToggleRecording: toggleRecording,
  onNewChat: createAndSelectChat,
  onStopRecording: stopRecordingAndDiscard,
  onSelectSuggestion: selectSuggestion,
  onStopSpeech: stop,
  onClear: clearInput,
  onStartRecording: startRecording,
  onStopRecordingAndSend: () => stopRecording(true),
})

const selectChat = (chatId: string) => {
  activeChatId.value = chatId
  if (!mdAndUp.value) compactView.value = 'conversation'
}

async function createAndSelectChat() {
  await createChat()
  if (!mdAndUp.value && activeChatId.value) compactView.value = 'conversation'
}

onMounted(async () => {
  await loadChats()
})
</script>

<template>
  <VContainer
    fluid
    class="pa-4 chat-page"
  >
    <VRow class="chat-row">
      <VCol
        v-show="mdAndUp || compactView === 'list'"
        cols="12"
        md="4"
        lg="3"
      >
        <ChatSidebar
          :chats="chats"
          :active-chat-id="activeChatId"
          :is-loading-chats="isLoadingChats"
          @create-chat="createAndSelectChat"
          @select-chat="selectChat"
          @delete-chat="deleteChat"
        />
      </VCol>

      <VCol
        v-show="mdAndUp || compactView === 'conversation'"
        cols="12"
        md="8"
        lg="9"
      >
        <VCard class="chat-panel">
          <VCardTitle class="d-flex align-center">
            <VBtn
              v-if="!mdAndUp"
              icon
              variant="text"
              :aria-label="t('chat.backToChats')"
              @click="compactView = 'list'"
            >
              <VIcon>mdi-arrow-left</VIcon>
            </VBtn>
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

          <ChatMessagesList
            :messages="messages"
            :is-loading-messages="isLoadingMessages"
            :error="error"
          />

          <ChatSuggestions
            :suggestions="quickSuggestions"
            @select-suggestion="sendSuggestion"
          />

          <VDivider />

          <ChatComposer
            v-model="inputText"
            :is-sending="isSending"
            :is-recording="isRecording"
            :recording-duration="recordingDuration"
            :recording-error="recordingError"
            :is-playing="isPlaying"
            @send="sendTypedMessage"
            @toggle-recording="toggleRecording"
            @clear="clearInput"
            @stop-speech="stop"
          />
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.chat-page {
  height: calc(100dvh - 64px); overflow: hidden;
}

.chat-row { height: 100%; }

.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 96px); max-height: calc(100dvh - 96px); min-height: 0;
}

@media (max-width: 959px) {
  .chat-page { height: calc(100dvh - 64px); padding: 8px !important; overflow: hidden; }
  .chat-row { margin: 0; }
  .chat-row > :deep(.v-col) { height: 100%; padding: 0; }
  .chat-panel { height: 100%; max-height: none; }
}
</style>
