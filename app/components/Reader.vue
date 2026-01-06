<script setup lang="ts">
import type { Statement } from '~/types/api'

const props = defineProps<{
  statements: Statement[]
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { speak, stop, isPlaying } = useTTS()

const currentIndex = ref(0)

const currentStatement = computed(() => 
  props.statements[currentIndex.value]
)

const canGoPrev = computed(() => currentIndex.value > 0)
const canGoNext = computed(() => currentIndex.value < props.statements.length - 1)

const prev = () => {
  if (canGoPrev.value) {
    stop()
    currentIndex.value--
  }
}

const next = () => {
  if (canGoNext.value) {
    stop()
    currentIndex.value++
  }
}

const togglePlay = () => {
  if (isPlaying.value) {
    stop()
  } else if (currentStatement.value) {
    speak(currentStatement.value.text, {
      onEnd: () => {
        // Auto advance to next
        if (canGoNext.value) {
          setTimeout(() => next(), 500)
        }
      },
    })
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case ' ':
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      prev()
      break
    case 'ArrowRight':
      event.preventDefault()
      next()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stop()
})
</script>

<template>
  <VDialog
    :model-value="true"
    fullscreen
    persistent
    @update:model-value="emit('close')"
  >
    <VCard class="reader-card">
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
        <VToolbarTitle>{{ t('reader.title') }}</VToolbarTitle>
        <VSpacer />
        <span class="text-subtitle-2">
          {{ currentIndex + 1 }} / {{ statements.length }}
        </span>
      </VToolbar>

      <VCardText class="reader-content">
        <div class="statement-display">
          <div class="statement-text">
            {{ currentStatement?.text }}
          </div>
        </div>

        <div class="reader-controls">
          <VBtn
            icon
            size="x-large"
            :disabled="!canGoPrev"
            @click="prev"
          >
            <VIcon size="large">
              mdi-chevron-left
            </VIcon>
          </VBtn>

          <VBtn
            icon
            size="x-large"
            color="primary"
            @click="togglePlay"
          >
            <VIcon size="large">
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </VIcon>
          </VBtn>

          <VBtn
            icon
            size="x-large"
            :disabled="!canGoNext"
            @click="next"
          >
            <VIcon size="large">
              mdi-chevron-right
            </VIcon>
          </VBtn>
        </div>

        <div class="shortcuts-hint text-center text-caption text-medium-emphasis mt-4">
          {{ t('reader.shortcuts') }}: Space - {{ t('reader.play') }}, ← → - {{ t('reader.navigate') }}, Esc - {{ t('reader.close') }}
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.reader-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.reader-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.statement-display {
  max-width: 800px;
  width: 100%;
  margin-bottom: 60px;
}

.statement-text {
  font-size: 2.5rem;
  line-height: 1.4;
  text-align: center;
  padding: 40px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 16px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reader-controls {
  display: flex;
  gap: 24px;
  align-items: center;
}

@media (max-width: 600px) {
  .statement-text {
    font-size: 1.8rem;
    padding: 24px;
  }
}
</style>

