<script setup lang="ts">
import { useReaderNavigation } from '~/composables/useReaderNavigation'
import type { Statement } from '~/types/api'

const props = defineProps<{
  statements: Statement[]
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const statementsRef = computed(() => props.statements)

const {
  currentIndex,
  currentStatement,
  canGoPrev,
  canGoNext,
  isPlaying,
  prev,
  next,
  togglePlay,
} = useReaderNavigation({
  statements: statementsRef,
  onClose: () => emit('close'),
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
          :aria-label="t('reader.close')"
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
            :aria-label="t('reader.previous')"
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
            :aria-label="isPlaying ? t('reader.pause') : t('reader.play')"
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
            :aria-label="t('reader.next')"
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

<style lang="scss">
@use '~/assets/styles/reader.scss' as *;
</style>
