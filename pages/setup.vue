<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useOnboardingSteps } from '~/composables/useOnboardingSteps'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const settingsStore = useSettingsStore()

const {
  currentStep,
  totalSteps,
  isLoading,
  nextStep,
  prevStep,
  finishSetup,
} = useOnboardingSteps()

onMounted(() => {
  settingsStore.initialize()
})

const testVoice = () => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(t('settings.voiceSettings.testText'))
    utterance.lang = 'ru-RU'
    utterance.volume = settingsStore.volume
    utterance.rate = settingsStore.rate
    utterance.pitch = settingsStore.pitch
    speechSynthesis.speak(utterance)
  }
}
</script>

<template>
  <VContainer
    fluid
    class="fill-height"
  >
    <VRow
      align="center"
      justify="center"
    >
      <VCol
        cols="12"
        md="8"
        lg="6"
      >
        <VCard class="pa-6">
          <VCardTitle class="text-center mb-4">
            <div class="text-h4 text-primary">
              {{ t('setup.welcome') }}
            </div>
          </VCardTitle>

          <VStepper
            v-model="currentStep"
            :items="[t('setup.step1'), t('setup.step2'), t('setup.step3')]"
            hide-actions
          >
            <template #item.1>
              <VCardText class="text-center pa-6">
                <VIcon
                  size="100"
                  color="primary"
                  class="mb-4"
                >
                  mdi-hand-wave
                </VIcon>
                <div class="text-h5 mb-4">
                  {{ t('setup.welcome') }}
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  {{ t('setup.welcomeText') }}
                </div>
              </VCardText>
            </template>

            <template #item.2>
              <VCardText class="pa-6">
                <div class="text-h6 mb-4">
                  {{ t('settings.voiceSettings.title') }}
                </div>

                <div class="mb-4">
                  <div class="text-body-2 mb-2">
                    {{ t('settings.voiceSettings.volume') }}: {{ Math.round(settingsStore.volume * 100) }}%
                  </div>
                  <VSlider
                    v-model="settingsStore.volume"
                    min="0"
                    max="1"
                    step="0.1"
                    thumb-label
                    :aria-label="t('a11y.volumeSlider')"
                  />
                </div>

                <div class="mb-4">
                  <div class="text-body-2 mb-2">
                    {{ t('settings.voiceSettings.rate') }}: {{ settingsStore.rate.toFixed(1) }}x
                  </div>
                  <VSlider
                    v-model="settingsStore.rate"
                    min="0.5"
                    max="2"
                    step="0.1"
                    thumb-label
                    :aria-label="t('a11y.rateSlider')"
                  />
                </div>

                <div class="mb-4">
                  <div class="text-body-2 mb-2">
                    {{ t('settings.voiceSettings.pitch') }}: {{ settingsStore.pitch.toFixed(1) }}
                  </div>
                  <VSlider
                    v-model="settingsStore.pitch"
                    min="0.5"
                    max="2"
                    step="0.1"
                    thumb-label
                    :aria-label="t('a11y.pitchSlider')"
                  />
                </div>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  prepend-icon="mdi-volume-high"
                  @click="testVoice"
                >
                  {{ t('settings.voiceSettings.test') }}
                </VBtn>
              </VCardText>
            </template>

            <template #item.3>
              <VCardText class="text-center pa-6">
                <VIcon
                  size="100"
                  color="success"
                  class="mb-4"
                >
                  mdi-check-circle
                </VIcon>
                <div class="text-h5 mb-4">
                  Готово!
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  Вы можете начать использовать приложение. Настройки можно изменить позже.
                </div>
              </VCardText>
            </template>
          </VStepper>

          <VCardActions class="pa-4">
            <VBtn
              v-if="currentStep > 1"
              variant="text"
              @click="prevStep"
            >
              {{ t('setup.back') }}
            </VBtn>
            <VSpacer />
            <VBtn
              v-if="currentStep < totalSteps"
              color="primary"
              @click="nextStep"
            >
              {{ t('setup.next') }}
            </VBtn>
            <VBtn
              v-else
              color="primary"
              :loading="isLoading"
              @click="finishSetup"
            >
              {{ t('setup.finish') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>
