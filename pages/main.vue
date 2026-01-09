<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useCategoriesStore } from '~/stores/categories'
import { useQuickesStore } from '~/stores/quickes'
import { useTTS } from '~/composables/useTTS'
import { useMainKeyboard } from '~/composables/useMainKeyboard'
import { useTypeSound } from '~/composables/useTypeSound'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'setup'],
})

const { t } = useI18n()
const settingsStore = useSettingsStore()
const categoriesStore = useCategoriesStore()
const quickesStore = useQuickesStore()
const { speak, stop, isPlaying } = useTTS()
const { handleTextInput } = useTypeSound()

const chats = ref(['', '', ''])
const activeChat = ref(0)
const showMode = ref(false)
const showDownload = ref(false)
const quickesRef = ref<{ focus: () => void } | null>(null)
const bankRef = ref<{ focus: () => void } | null>(null)

onMounted(async () => {
  await settingsStore.initialize()
  try {
    await Promise.all([
      categoriesStore.fetchCategories(),
      quickesStore.fetchQuickes(),
    ])
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})

const currentText = computed({
  get: () => chats.value[activeChat.value],
  set: (value: string) => {
    chats.value[activeChat.value] = value
  },
})

const toggleSpotlight = () => {
  showMode.value = !showMode.value
}

const focusQuickes = () => {
  quickesRef.value?.focus()
}

const focusBank = () => {
  bankRef.value?.focus()
}

useMainKeyboard({
  activeChat,
  onToggleSpotlight: toggleSpotlight,
  onFocusQuickes: focusQuickes,
  onFocusBank: focusBank,
})

const onTextInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  handleTextInput(target.value, currentText.value)
}

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

watch(() => settingsStore.yandex, (value) => {
  showDownload.value = value
}, { immediate: true })
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <MainChatTabs
      v-model="activeChat"
      :show-mode="showMode"
      @close-spotlight="showMode = false"
    />

    <MainInput
      v-model="currentText"
      :is-playing="isPlaying"
      :show-download="showDownload"
      :show-predictor="settingsStore.showPredictor"
      @say="handleSay"
      @clear="currentText = ''"
      @toggle-spotlight="toggleSpotlight"
      @text-input="onTextInput"
    />

    <Quickes
      v-if="settingsStore.showQuickes"
      ref="quickesRef"
      class="mt-6"
      @click="handleQuickeClick"
    />

    <Bank
      v-if="settingsStore.showBank"
      ref="bankRef"
      class="mt-6"
      @paste="handlePaste"
      @speak="handleSpeak"
    />

    <div
      class="sr-only"
      aria-live="polite"
    >
      {{ isPlaying ? t('status.playing') : t('status.stopped') }}
    </div>

    <MainSpotlightDialog
      v-model="showMode"
      :text="currentText"
      @update:text="currentText = $event"
      @say="handleSay(false)"
    />
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
