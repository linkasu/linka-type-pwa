<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import type { TTSVoice } from '~/api/tts'

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
})

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { setLocale, locale } = useI18n()
const { $api } = useNuxtApp()

const activeTab = ref('voice')

// TTS voices from API
const ttsVoices = ref<TTSVoice[]>([])
const selectedTtsVoice = ref(settingsStore.yandexVoice || 'alena')
const isLoadingVoices = ref(false)

// Browser voices
const browserVoices = ref<SpeechSynthesisVoice[]>([])
const selectedBrowserVoice = ref(settingsStore.voiceUri || '')

// Voice test
const isTestingVoice = ref(false)

const loadTtsVoices = async () => {
  isLoadingVoices.value = true
  try {
    ttsVoices.value = await $api.tts.getVoices()
  } catch (err) {
    console.error('Failed to load TTS voices:', err)
  } finally {
    isLoadingVoices.value = false
  }
}

const testVoice = async () => {
  const testText = t('settings.voiceSettings.testText') || 'Привет! Это тест голоса.'
  
  if (settingsStore.yandex) {
    isTestingVoice.value = true
    try {
      const blob = await $api.tts.synthesize({
        text: testText,
        voice: selectedTtsVoice.value,
        speed: settingsStore.rate,
      })
      const audio = new Audio(URL.createObjectURL(blob))
      audio.volume = settingsStore.volume
      audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      speakWithWebSpeech(testText)
    } finally {
      isTestingVoice.value = false
    }
  } else {
    speakWithWebSpeech(testText)
  }
}

const speakWithWebSpeech = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale.value === 'ru' ? 'ru-RU' : 'en-US'
    utterance.volume = settingsStore.volume
    utterance.rate = settingsStore.rate
    utterance.pitch = settingsStore.pitch
    
    const selectedVoice = browserVoices.value.find(v => v.voiceURI === selectedBrowserVoice.value)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    speechSynthesis.speak(utterance)
  }
}

// Computed for voice select items
const ttsVoiceItems = computed(() => {
  return ttsVoices.value.map(v => ({
    title: `${v.name} (${v.engine === 'yandex' ? 'Яндекс' : 'Sber'}, ${v.gender === 'F' ? 'Ж' : 'М'})`,
    value: v.id,
    subtitle: v.lang,
  }))
})

const russianTtsVoices = computed(() => {
  return ttsVoiceItems.value.filter(v => {
    const voice = ttsVoices.value.find(tv => tv.id === v.value)
    return voice?.lang_code === 'ru-RU'
  })
})

onMounted(() => {
  settingsStore.loadFromStorage()
  
  // Load TTS voices
  loadTtsVoices()
  
  // Load browser voices
  const loadBrowserVoices = () => {
    browserVoices.value = speechSynthesis.getVoices().filter(v => 
      v.lang.startsWith('ru') || v.lang.startsWith('en')
    )
    if (!selectedBrowserVoice.value && browserVoices.value.length > 0) {
      selectedBrowserVoice.value = browserVoices.value[0].voiceURI
    }
  }
  
  loadBrowserVoices()
  speechSynthesis.onvoiceschanged = loadBrowserVoices
})

watch(selectedBrowserVoice, (uri) => {
  settingsStore.setVoiceSettings({ voiceUri: uri })
})

watch(selectedTtsVoice, (voice) => {
  settingsStore.setVoiceSettings({ yandexVoice: voice })
})

const handleLocaleChange = (newLocale: 'ru' | 'en') => {
  setLocale(newLocale)
  settingsStore.setLocale(newLocale)
}
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <div class="text-h5 mb-4">
      {{ t('settings.title') }}
    </div>

    <VTabs
      v-model="activeTab"
      color="primary"
      class="mb-4"
    >
      <VTab value="voice">
        <VIcon start>
          mdi-volume-high
        </VIcon>
        {{ t('settings.voice') }}
      </VTab>
      <VTab value="adaptive">
        <VIcon start>
          mdi-tune
        </VIcon>
        {{ t('settings.adaptive') }}
      </VTab>
      <VTab value="import">
        <VIcon start>
          mdi-download
        </VIcon>
        {{ t('settings.import') }}
      </VTab>
      <VTab value="account">
        <VIcon start>
          mdi-account
        </VIcon>
        {{ t('settings.account') }}
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <!-- Voice Settings -->
      <VWindowItem value="voice">
        <VCard class="pa-4">
          <VCardTitle>{{ t('settings.voiceSettings.title') }}</VCardTitle>
          <VCardText>
            <VSwitch
              :model-value="settingsStore.yandex"
              :label="t('settings.voiceSettings.yandexTTS')"
              color="primary"
              class="mb-4"
              @update:model-value="settingsStore.toggleYandexTTS()"
            />

            <VSelect
              v-if="settingsStore.yandex"
              v-model="selectedTtsVoice"
              :items="russianTtsVoices"
              :label="t('settings.voiceSettings.selectVoice')"
              :loading="isLoadingVoices"
              class="mb-4"
            />

            <VSelect
              v-else
              v-model="selectedBrowserVoice"
              :items="browserVoices"
              :label="t('settings.voiceSettings.selectVoice')"
              item-title="name"
              item-value="voiceURI"
              class="mb-4"
            />

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span>{{ t('settings.voiceSettings.volume') }}</span>
                <span>{{ Math.round(settingsStore.volume * 100) }}%</span>
              </div>
              <VSlider
                :model-value="settingsStore.volume"
                min="0"
                max="1"
                step="0.1"
                :aria-label="t('a11y.volumeSlider')"
                @update:model-value="settingsStore.setVoiceSettings({ volume: $event })"
              />
            </div>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span>{{ t('settings.voiceSettings.rate') }}</span>
                <span>{{ settingsStore.rate.toFixed(1) }}x</span>
              </div>
              <VSlider
                :model-value="settingsStore.rate"
                min="0.5"
                max="2"
                step="0.1"
                :aria-label="t('a11y.rateSlider')"
                @update:model-value="settingsStore.setVoiceSettings({ rate: $event })"
              />
            </div>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span>{{ t('settings.voiceSettings.pitch') }}</span>
                <span>{{ settingsStore.pitch.toFixed(1) }}</span>
              </div>
              <VSlider
                :model-value="settingsStore.pitch"
                min="0.5"
                max="2"
                step="0.1"
                :aria-label="t('a11y.pitchSlider')"
                @update:model-value="settingsStore.setVoiceSettings({ pitch: $event })"
              />
            </div>

            <VBtn
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-volume-high"
              class="mt-4"
              :loading="isTestingVoice"
              @click="testVoice"
            >
              {{ t('settings.voiceSettings.test') }}
            </VBtn>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Adaptive Settings -->
      <VWindowItem value="adaptive">
        <VCard class="pa-4">
          <VCardTitle>{{ t('settings.adaptiveSettings.title') }}</VCardTitle>
          <VCardText>
            <VSwitch
              :model-value="settingsStore.showPredictor"
              :label="t('settings.adaptiveSettings.showPredictor')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ showPredictor: $event })"
            />

            <VSwitch
              :model-value="settingsStore.showQuickes"
              :label="t('settings.adaptiveSettings.showQuickes')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ showQuickes: $event })"
            />

            <VSwitch
              :model-value="settingsStore.showBank"
              :label="t('settings.adaptiveSettings.showBank')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ showBank: $event })"
            />

            <VDivider class="my-4" />

            <VSwitch
              :model-value="settingsStore.saveOnSay"
              :label="t('settings.adaptiveSettings.saveOnSay')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ saveOnSay: $event })"
            />

            <VSwitch
              :model-value="settingsStore.typeSound"
              :label="t('settings.adaptiveSettings.typeSound')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ typeSound: $event })"
            />

            <VSwitch
              :model-value="settingsStore.speakLastWord"
              :label="t('settings.adaptiveSettings.speakLastWord')"
              color="primary"
              @update:model-value="settingsStore.updateSettings({ speakLastWord: $event })"
            />

            <VDivider class="my-4" />

            <VSwitch
              :model-value="settingsStore.darkTheme"
              :label="t('settings.adaptiveSettings.darkTheme')"
              color="primary"
              @update:model-value="settingsStore.toggleDarkTheme()"
            />

            <VSelect
              :model-value="settingsStore.locale"
              :items="[
                { title: 'Русский', value: 'ru' },
                { title: 'English', value: 'en' },
              ]"
              label="Язык / Language"
              class="mt-4"
              @update:model-value="handleLocaleChange"
            />
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Import Settings -->
      <VWindowItem value="import">
        <VCard class="pa-4">
          <VCardTitle>{{ t('settings.importSettings.title') }}</VCardTitle>
          <VCardText>
            <GlobalImport />
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Account Settings -->
      <VWindowItem value="account">
        <VCard class="pa-4">
          <VCardTitle>{{ t('settings.accountSettings.title') }}</VCardTitle>
          <VCardText>
            <AccountSettings />
          </VCardText>
        </VCard>
      </VWindowItem>
    </VWindow>
  </VContainer>
</template>

