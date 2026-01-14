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
.quickes-container {
  background: linear-gradient(135deg, rgba(251, 204, 48, 0.08) 0%, rgba(251, 204, 48, 0.15) 100%);
  border: 1px solid rgba(251, 204, 48, 0.25);
}

.quickes-btn {
  position: relative;
  justify-content: flex-start;
  text-transform: none;
  min-height: 44px;
  padding-left: 38px;
  background: rgba(251, 204, 48, 0.18) !important;
  border: 1px solid rgba(251, 204, 48, 0.3);
  transition: all 0.2s ease;
}

.quickes-btn:hover {
  background: rgba(251, 204, 48, 0.28) !important;
  border-color: rgba(251, 204, 48, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(251, 204, 48, 0.2);
}

.quickes-badge {
  position: absolute;
  left: 8px;
  width: 22px;
  height: 22px;
  background: var(--linka-primary, #197377);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.quickes-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--linka-text);
  font-weight: 500;
}
</style>
