<script setup lang="ts">
import { TUTORIAL_STEPS } from '~/types/tutorial'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const step = ref(0)

const steps = computed(() =>
  TUTORIAL_STEPS.map(s => ({
    title: t(s.titleKey),
    content: t(s.contentKey),
    icon: s.icon,
  })),
)

const canGoPrev = computed(() => step.value > 0)
const canGoNext = computed(() => step.value < steps.value.length - 1)

const next = () => {
  if (canGoNext.value) {
    step.value++
  } else {
    emit('close')
  }
}

const prev = () => {
  if (canGoPrev.value) {
    step.value--
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  } else if (event.key === 'ArrowRight') {
    next()
  } else if (event.key === 'ArrowLeft') {
    prev()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <VDialog
    :model-value="true"
    fullscreen
    @update:model-value="emit('close')"
  >
    <VCard class="tutorial-card">
      <VToolbar
        color="primary"
        dark
      >
        <VBtn
          icon
          @click="emit('close')"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('tutorial.title') }}</VToolbarTitle>
        <VSpacer />
        <span class="text-subtitle-2">
          {{ step + 1 }} / {{ steps.length }}
        </span>
      </VToolbar>

      <VCardText class="tutorial-content">
        <div class="step-container">
          <VIcon
            size="80"
            color="primary"
            class="step-icon"
          >
            {{ steps[step].icon }}
          </VIcon>

          <h2 class="text-h4 mb-4">
            {{ steps[step].title }}
          </h2>

          <p class="text-body-1 text-medium-emphasis">
            {{ steps[step].content }}
          </p>

          <div class="step-indicators mt-8">
            <span
              v-for="(s, i) in steps"
              :key="i"
              class="indicator"
              :class="{ active: i === step }"
            />
          </div>
        </div>
      </VCardText>

      <VCardActions class="justify-space-between pa-6">
        <VBtn
          variant="text"
          :disabled="!canGoPrev"
          @click="prev"
        >
          <VIcon start>
            mdi-chevron-left
          </VIcon>
          {{ t('tutorial.prev') }}
        </VBtn>

        <VBtn
          variant="text"
          @click="emit('close')"
        >
          {{ t('tutorial.skip') }}
        </VBtn>

        <VBtn
          color="primary"
          variant="flat"
          @click="next"
        >
          {{ canGoNext ? t('tutorial.next') : t('tutorial.finish') }}
          <VIcon end>
            mdi-chevron-right
          </VIcon>
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.tutorial-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tutorial-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.step-container {
  max-width: 600px;
  text-align: center;
}

.step-icon {
  margin-bottom: 24px;
}

.step-indicators {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.2);
  transition: all 0.3s;
}

.indicator.active {
  width: 24px;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
}
</style>

