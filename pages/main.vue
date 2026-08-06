<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useCategoriesStore } from '~/stores/categories'
import { useQuickesStore } from '~/stores/quickes'
import { useTTS } from '~/composables/useTTS'
import { useMainKeyboard } from '~/composables/useMainKeyboard'
import { useTypeSound } from '~/composables/useTypeSound'
import { useAnalytics } from '~/composables/useAnalytics'
import { useDisplay } from 'vuetify'
type MainSection = 'input' | 'quickes' | 'bank'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const categoriesStore = useCategoriesStore()
const quickesStore = useQuickesStore()
const { speak, stop, isPlaying } = useTTS()
const { handleTextInput } = useTypeSound()
const { trackSay, trackSpotlight } = useAnalytics()
const { mdAndUp } = useDisplay()

const chats = ref(['', '', ''])
const activeChat = useSharedState<number>('activeChat', () => 0)
const showMode = ref(false)
const showDownload = ref(false)
const activeSection = ref<MainSection>('input')
const mainInputRef = ref<{ focus: () => void } | null>(null)
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
  trackSpotlight(showMode.value ? 'open' : 'close')
}

const focusMainInput = () => {
  activeSection.value = 'input'
  nextTick(() => mainInputRef.value?.focus())
}

const focusQuickes = () => {
  activeSection.value = 'quickes'
  nextTick(() => quickesRef.value?.focus())
}

const focusBank = () => {
  activeSection.value = 'bank'
  nextTick(() => bankRef.value?.focus())
}

useMainKeyboard({
  activeChat,
  onToggleSpotlight: toggleSpotlight,
  onFocusInput: focusMainInput,
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
    trackSay(currentText.value.length, download)
    speak(currentText.value, { download })
  }
}

const handlePaste = (text: string) => {
  currentText.value += (currentText.value ? ' ' : '') + text
  if (!mdAndUp.value) {
    activeSection.value = 'input'
    nextTick(() => mainInputRef.value?.focus())
  }
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

watch(
  [() => settingsStore.showQuickes, () => settingsStore.showBank],
  ([showQuickes, showBank]) => {
    if ((activeSection.value === 'quickes' && !showQuickes) || (activeSection.value === 'bank' && !showBank)) {
      activeSection.value = 'input'
    }
  },
)
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <MainCompactSectionTabs
      v-if="!mdAndUp"
      v-model="activeSection"
      :show-quickes="settingsStore.showQuickes"
      :show-bank="settingsStore.showBank"
      class="mb-4"
    />

    <div v-show="mdAndUp || activeSection === 'input'">
      <MainInput
        v-model="currentText"
        ref="mainInputRef"
        :is-playing="isPlaying"
        :show-download="showDownload"
        :show-predictor="settingsStore.showPredictor && !showMode"
        @say="handleSay"
        @clear="currentText = ''"
        @toggle-spotlight="toggleSpotlight"
        @text-input="onTextInput"
      />
    </div>

    <div
      v-if="settingsStore.showQuickes"
      v-show="mdAndUp || activeSection === 'quickes'"
    >
      <Quickes
        ref="quickesRef"
        :class="{ 'mt-4': mdAndUp }"
        @click="handleQuickeClick"
      />
    </div>

    <div
      v-if="settingsStore.showBank"
      v-show="mdAndUp || activeSection === 'bank'"
    >
      <Bank
        ref="bankRef"
        :class="{ 'mt-4': mdAndUp }"
        @paste="handlePaste"
        @speak="handleSpeak"
      />
    </div>

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
