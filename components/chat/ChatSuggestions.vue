<script setup lang="ts">
import type { ChatSuggestion } from '~/composables/chat/types'

const props = defineProps<{
  suggestions: ChatSuggestion[]
}>()

const emit = defineEmits<{
  selectSuggestion: [suggestion: ChatSuggestion]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.suggestions.length"
    class="chat-suggestions"
  >
    <div class="text-caption text-medium-emphasis mb-2">
      {{ t('chat.suggestions') }} <span class="suggestion-hint">(Alt/Cmd + 1-5)</span>
    </div>
    <div class="suggestion-chips">
      <VChip
        v-for="(suggestion, index) in props.suggestions.slice(0, 5)"
        :key="suggestion.id ?? `${suggestion.text}-${index}`"
        class="suggestion-chip"
        variant="flat"
        color="accent"
        @click="emit('selectSuggestion', suggestion)"
      >
        <span class="suggestion-number">{{ index + 1 }}</span>
        {{ suggestion.text }}
      </VChip>
    </div>
  </div>
</template>

<style scoped>
.chat-suggestions {
  flex-shrink: 0;
  padding: 12px 16px 4px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  cursor: pointer;
}

.suggestion-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  border-radius: 50%;
  background: var(--linka-primary, #197377);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
}

.suggestion-hint {
  opacity: 0.6;
  font-size: 0.7rem;
}
</style>
