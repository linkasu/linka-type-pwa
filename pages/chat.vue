<script setup lang="ts">
import ChatComposer from '~/components/chat/ChatComposer.vue'
import ChatMessagesList from '~/components/chat/ChatMessagesList.vue'
import ChatSidebar from '~/components/chat/ChatSidebar.vue'
import ChatSuggestions from '~/components/chat/ChatSuggestions.vue'
import { useAudioRecording } from '~/composables/chat/useAudioRecording'
import { useChatDialogs } from '~/composables/chat/useChatDialogs'
import { useChatKeyboard } from '~/composables/useChatKeyboard'
import { useChatMessaging } from '~/composables/chat/useChatMessaging'

const { t } = useI18n()

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
  onNewChat: createChat,
  onStopRecording: stopRecordingAndDiscard,
  onSelectSuggestion: selectSuggestion,
  onStopSpeech: stop,
  onClear: clearInput,
  onStartRecording: startRecording,
  onStopRecordingAndSend: () => stopRecording(true),
})

onMounted(async () => {
  await loadChats()
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
        <ChatSidebar
          :chats="chats"
          :active-chat-id="activeChatId"
          :is-loading-chats="isLoadingChats"
          @create-chat="createChat"
          @select-chat="activeChatId = $event"
          @delete-chat="deleteChat"
        />
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
  height: calc(100vh - 64px);
  overflow: hidden;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px);
  max-height: calc(100vh - 96px);
}

@media (max-width: 959px) {
  .chat-page {
    height: auto;
    min-height: calc(100vh - 64px);
    overflow: visible;
  }

  .chat-panel {
    height: auto;
    min-height: 60vh;
    max-height: none;
  }
}
</style>
