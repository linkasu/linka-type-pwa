<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'
import { useTTS } from '~/composables/useTTS'
import { useMainDataLoading } from '~/composables/useMainDataLoading'
import { useMainKeyboard } from '~/composables/useMainKeyboard'
import { useTypeSound } from '~/composables/useTypeSound'
import { useAnalytics } from '~/composables/useAnalytics'
import { useDisplay } from 'vuetify'
type MainSection = 'input' | 'quickes' | 'bank'

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const { loadMainData, loadState } = useMainDataLoading()
const { speak, stop, isPlaying } = useTTS()
const { handleTextInput } = useTypeSound()
const { trackSay, trackSpotlight } = useAnalytics()
const { mdAndUp } = useDisplay()

const chats = ref(['', '', ''])
const activeChat = useSharedState<number>('activeChat', () => 0)
const showMode = ref(false)
const showDownload = computed(() => settingsStore.yandex)
const activeSection = ref<MainSection>('input')
const mainInputRef = ref<{ focus: () => void } | null>(null)
const quickesRef = ref<{ focus: () => void } | null>(null)
const bankRef = ref<{ focus: () => void } | null>(null)

onMounted((): void => { void loadMainData() })

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

const updateSpotlight = (open: boolean) => {
  showMode.value = open
  if (!open) focusMainInput()
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
    if (!currentText.value.trim()) return
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

    <MainLoadError
      v-if="loadState"
      class="mb-4"
      :warning="loadState === 'warning'"
      :show-login="authStore.mode === 'online' && !authStore.isAuthenticated"
      @retry="loadMainData"
      @login="router.push('/login')"
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
      class="d-sr-only"
      aria-live="polite"
    >
      {{ isPlaying ? t('status.playing') : t('status.stopped') }}
    </div>

    <MainSpotlightDialog
      :model-value="showMode"
      :text="currentText"
      @update:model-value="updateSpotlight"
      @update:text="currentText = $event"
      @say="handleSay(false)"
    />
  </VContainer>
</template>
