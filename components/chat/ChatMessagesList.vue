<script setup lang="ts">
import type { DialogMessage } from '~/types/api'

const props = defineProps<{
  messages: DialogMessage[]
  isLoadingMessages: boolean
  error: string | null
}>()

const { t, locale } = useI18n()
const containerRef = ref<HTMLElement | null>(null)

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (!containerRef.value) return
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    })
  })
}

watch(() => props.messages.length, () => {
  scrollToBottom()
})
</script>

<template>
  <div class="chat-body">
    <div
      v-if="props.error"
      class="text-error text-caption mb-2"
    >
      {{ props.error }}
    </div>

    <div
      v-if="props.isLoadingMessages"
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
      ref="containerRef"
      class="chat-messages"
    >
      <div
        v-if="!props.messages.length"
        class="text-medium-emphasis"
      >
        {{ t('chat.empty') }}
      </div>

      <div
        v-for="message in props.messages"
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
</template>

<style scoped>
.chat-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
  padding-right: 4px;
  scroll-behavior: smooth;
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
  background: #f0f0f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  white-space: pre-wrap;
}

.chat-message.is-user .message-bubble {
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.chat-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

@media (max-width: 959px) {
  .chat-body {
    max-height: 40vh;
    overflow: hidden;
  }

  .chat-messages {
    max-height: 35vh;
  }
}
</style>
