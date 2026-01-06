<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useCategoriesStore } from '~/stores/categories'
import { useQuickesStore } from '~/stores/quickes'
import { useTTS } from '~/composables/useTTS'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'setup'],
})

const { t } = useI18n()
const settingsStore = useSettingsStore()
const categoriesStore = useCategoriesStore()
const quickesStore = useQuickesStore()
const { speak, stop, isPlaying, speakLastWord } = useTTS()

// Chat state - 3 independent text fields
const chats = ref(['', '', ''])
const activeChat = ref(0)
const showMode = ref(false)
const showDownload = ref(false)

// Load data on mount
onMounted(async () => {
  settingsStore.loadFromStorage()
  
  try {
    await Promise.all([
      categoriesStore.fetchCategories(),
      quickesStore.fetchQuickes(),
    ])
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})

// Current chat text
const currentText = computed({
  get: () => chats.value[activeChat.value],
  set: (value: string) => {
    chats.value[activeChat.value] = value
  },
})

// Switch chat with Ctrl+Up/Down
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'ArrowUp') {
    event.preventDefault()
    activeChat.value = (activeChat.value + 2) % 3
  } else if (event.ctrlKey && event.key === 'ArrowDown') {
    event.preventDefault()
    activeChat.value = (activeChat.value + 1) % 3
  } else if (event.ctrlKey && event.key === '0') {
    event.preventDefault()
    // Focus quickes - emit event or use ref
  } else if (event.ctrlKey && event.key === ';') {
    event.preventDefault()
    // Focus bank - emit event or use ref
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Type sound
let typeAudio: HTMLAudioElement | null = null
const playTypeSound = () => {
  if (settingsStore.typeSound) {
    if (!typeAudio) {
      typeAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEA==')
      typeAudio.volume = 0.3
    }
    typeAudio.currentTime = 0
    typeAudio.play().catch(() => {})
  }
}

// Speak last word on space
const handleTextInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const newValue = target.value
  const oldValue = currentText.value

  if (settingsStore.typeSound) {
    playTypeSound()
  }

  if (settingsStore.speakLastWord && newValue.endsWith(' ') && !oldValue.endsWith(' ')) {
    const words = newValue.trim().split(/\s+/)
    const lastWord = words[words.length - 1]
    if (lastWord) {
      speakLastWord(lastWord)
    }
  }
}

// TTS functions
const handleSay = (download = false) => {
  if (isPlaying.value) {
    stop()
  } else {
    speak(currentText.value, { download })
  }
}

const handlePaste = (text: string) => {
  currentText.value += (currentText.value ? ' ' : '') + text
}

const handleQuickeClick = (text: string) => {
  speak(text)
}

const handleSpeak = (text: string) => {
  speak(text)
}

// Show download button only for Yandex TTS
watch(() => settingsStore.yandex, (value) => {
  showDownload.value = value
}, { immediate: true })
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <!-- Chat indicator -->
    <div class="d-flex align-center mb-4">
      <VBtnToggle
        v-model="activeChat"
        mandatory
        density="compact"
        color="primary"
      >
        <VBtn
          v-for="i in 3"
          :key="i"
          :value="i - 1"
          size="small"
          :aria-label="`${t('main.chat')} ${i}`"
        >
          {{ i }}
        </VBtn>
      </VBtnToggle>
      <span class="text-body-2 ml-2 text-medium-emphasis">
        {{ t('main.chat') }} {{ activeChat + 1 }}
      </span>
      <VSpacer />
      <VBtn
        v-if="showMode"
        icon
        size="small"
        variant="text"
        @click="showMode = false"
      >
        <VIcon>mdi-fullscreen-exit</VIcon>
      </VBtn>
    </div>

    <!-- Main input area -->
    <div
      class="main-input"
      :class="{ fullscreen: showMode }"
    >
      <VTextarea
        v-model="currentText"
        :placeholder="t('main.placeholder')"
        rows="4"
        auto-grow
        :aria-label="t('main.placeholder')"
        @keydown.enter.exact.prevent="handleSay(false)"
        @keydown.ctrl.enter="currentText += '\n'"
        @input="handleTextInput"
      >
        <template #append-inner>
          <VBtn
            icon
            size="small"
            variant="text"
            @click="showMode = !showMode"
          >
            <VIcon>{{ showMode ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</VIcon>
          </VBtn>
        </template>
      </VTextarea>

      <div class="d-flex gap-2 mt-2">
        <VBtn
          color="primary"
          size="large"
          :prepend-icon="isPlaying ? 'mdi-stop' : 'mdi-volume-high'"
          :aria-label="isPlaying ? t('a11y.stopButton') : t('a11y.playButton')"
          class="flex-grow-1"
          @click="handleSay(false)"
        >
          {{ isPlaying ? t('main.stop') : t('main.say') }}
        </VBtn>
        <VBtn
          v-if="showDownload"
          variant="outlined"
          size="large"
          icon
          :aria-label="t('main.download')"
          :disabled="!currentText.trim()"
          @click="handleSay(true)"
        >
          <VIcon>mdi-download</VIcon>
        </VBtn>
        <VBtn
          variant="outlined"
          size="large"
          icon
          :aria-label="t('main.clear')"
          @click="currentText = ''"
        >
          <VIcon>mdi-delete</VIcon>
        </VBtn>
      </div>

      <!-- Predictor -->
      <Predictor
        v-if="settingsStore.showPredictor"
        v-model="currentText"
        class="mt-4"
      />
    </div>

    <!-- Quickes -->
    <Quickes
      v-if="settingsStore.showQuickes"
      class="mt-6"
      @click="handleQuickeClick"
    />

    <!-- Bank -->
    <Bank
      v-if="settingsStore.showBank"
      class="mt-6"
      @paste="handlePaste"
      @speak="handleSpeak"
    />

    <!-- TTS status for screen readers -->
    <div
      class="sr-only"
      aria-live="polite"
    >
      {{ isPlaying ? t('status.playing') : t('status.stopped') }}
    </div>
  </VContainer>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

