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
    content-class="reader-dialog"
    @update:model-value="emit('close')"
  >
    <div class="reader-container">
      <div class="reader-header">
        <VBtn
          icon
          variant="text"
          color="white"
          @click="emit('close')"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <span class="reader-counter">
          {{ currentIndex + 1 }} / {{ statements.length }}
        </span>
      </div>

      <div class="reader-content">
        <div class="statement-display">
          <div class="statement-text">
            {{ currentStatement?.text }}
          </div>
        </div>

        <div class="reader-controls">
          <VBtn
            icon
            size="x-large"
            variant="outlined"
            color="white"
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
            variant="flat"
            color="white"
            @click="togglePlay"
          >
            <VIcon
              size="large"
              color="black"
            >
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </VIcon>
          </VBtn>

          <VBtn
            icon
            size="x-large"
            variant="outlined"
            color="white"
            :disabled="!canGoNext"
            @click="next"
          >
            <VIcon size="large">
              mdi-chevron-right
            </VIcon>
          </VBtn>
        </div>

        <div class="shortcuts-hint">
          {{ t('reader.shortcuts') }}: Space - {{ t('reader.play') }}, ← → - {{ t('reader.navigate') }}, Esc - {{ t('reader.close') }}
        </div>
      </div>
    </div>
  </VDialog>
</template>

<style scoped>
.reader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  flex-direction: column;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}

.reader-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.reader-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.statement-display {
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}

.statement-text {
  color: #fff;
  font-size: 10vh;
  line-height: 1.2em;
  text-align: center;
  padding: 40px;
  border: 3px solid #fff;
  width: 100%;
  max-width: calc(100vw - 80px);
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.reader-controls {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.shortcuts-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  text-align: center;
}

@media (max-width: 600px) {
  .statement-text {
    font-size: 6vh;
    padding: 20px;
  }
}
</style>

<style>
.reader-dialog {
  background-color: #000 !important;
}

.reader-dialog .v-overlay__content {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  margin: 0 !important;
}
</style>

