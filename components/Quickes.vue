<script setup lang="ts">
import { useQuickesStore } from '~/stores/quickes'

const emit = defineEmits<{
  click: [text: string]
}>()

const { t } = useI18n()
const quickesStore = useQuickesStore()
const containerRef = ref<HTMLElement | null>(null)

// Handle keyboard shortcuts 1-6 when focused
const handleKeydown = (event: KeyboardEvent) => {
  const num = parseInt(event.key)
  if (num >= 1 && num <= 6) {
    const text = quickesStore.quickes[num - 1]
    if (text) {
      emit('click', text)
    }
  }
}

const focus = () => {
  containerRef.value?.focus()
}

defineExpose({ focus })

const handleClick = (index: number) => {
  const text = quickesStore.quickes[index]
  if (text) {
    emit('click', text)
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="quickes-container"
    role="region"
    :aria-label="t('a11y.quickesList')"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <div class="d-flex align-center mb-3">
      <VIcon
        class="mr-2"
        color="accent"
      >
        mdi-lightning-bolt
      </VIcon>
      <span class="text-subtitle-1 font-weight-medium">{{ t('quickes.title') }}</span>
    </div>

    <div class="quickes-grid">
      <VBtn
        v-for="(phrase, index) in quickesStore.quickes"
        :key="index"
        color="accent"
        variant="tonal"
        class="quickes-btn"
        :aria-label="`${t('quickes.title')} ${index + 1}: ${phrase}`"
        :aria-keyshortcuts="`${index + 1}`"
        @click="handleClick(index)"
      >
        <span class="quickes-badge">{{ index + 1 }}</span>
        <span class="quickes-text">{{ phrase }}</span>
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.quickes-btn {
  position: relative;
  justify-content: flex-start;
  text-transform: none;
  min-height: 48px;
  padding-left: 40px;
}

.quickes-badge {
  position: absolute;
  left: 8px;
  width: 24px;
  height: 24px;
  background: var(--linka-primary, #197377);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.quickes-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--linka-text);
}
</style>
