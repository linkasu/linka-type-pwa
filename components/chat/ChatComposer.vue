<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  isSending: boolean
  isRecording: boolean
  recordingDuration: number
  recordingError: string | null
  isPlaying: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: []
  toggleRecording: []
  clear: []
  stopSpeech: []
}>()

const { t } = useI18n()

const updateModelValue = (value: string) => {
  emit('update:modelValue', value)
}

const appendNewLine = () => {
  emit('update:modelValue', `${props.modelValue}\n`)
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="chat-input">
    <VTextarea
      :model-value="props.modelValue"
      :placeholder="t('chat.placeholder')"
      rows="3"
      auto-grow
      :aria-label="t('chat.placeholder')"
      @update:model-value="updateModelValue($event as string)"
      @keydown.enter.exact.prevent="emit('send')"
      @keydown.enter.ctrl="appendNewLine"
      @keydown.enter.meta="appendNewLine"
    />

    <div class="chat-actions">
      <VBtn
        color="primary"
        size="large"
        :disabled="!props.modelValue.trim() || props.isSending"
        @click="emit('send')"
      >
        <VIcon start>mdi-send</VIcon>
        {{ t('chat.send') }}
      </VBtn>

      <VBtn
        :color="props.isRecording ? 'error' : 'secondary'"
        size="large"
        :loading="props.isSending"
        @click="emit('toggleRecording')"
      >
        <VIcon start>
          {{ props.isRecording ? 'mdi-stop-circle-outline' : 'mdi-microphone' }}
        </VIcon>
        {{ props.isRecording ? t('chat.stopRecord') : t('chat.record') }}
        <span class="hotkey-hint">⌘L</span>
      </VBtn>

      <VBtn
        variant="outlined"
        size="large"
        icon
        :aria-label="t('chat.clear')"
        @click="emit('clear')"
      >
        <VIcon>mdi-delete</VIcon>
      </VBtn>

      <VBtn
        variant="outlined"
        size="large"
        icon
        :aria-label="t('chat.stopSpeech')"
        :disabled="!props.isPlaying"
        @click="emit('stopSpeech')"
      >
        <VIcon>mdi-stop</VIcon>
      </VBtn>
    </div>

    <div class="chat-status-bar">
      <div
        v-if="props.isRecording"
        class="recording-indicator"
      >
        <VIcon color="error" size="small">mdi-record</VIcon>
        <span>{{ t('chat.recording') }}</span>
        <span class="recording-time">{{ formatDuration(props.recordingDuration) }}</span>
      </div>
      <div
        v-else-if="props.recordingError"
        class="text-error text-caption"
      >
        {{ props.recordingError }}
      </div>
      <div
        v-else
        class="hotkey-bar"
      >
        <span class="hotkey-item"><kbd>Space</kbd> {{ t('chat.pushToTalk') }}</span>
        <span class="hotkey-item"><kbd>⌘L</kbd> {{ t('chat.record') }}</span>
        <span class="hotkey-item"><kbd>Enter</kbd> {{ t('chat.send') }}</span>
        <span class="hotkey-item"><kbd>Esc</kbd> {{ t('actions.cancel') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/components/chat-composer.scss"></style>
