<script setup lang="ts">
const props = defineProps<{
  isShowingCategories: boolean
  isPasteMode: boolean
}>()

const emit = defineEmits<{
  back: []
  togglePasteMode: []
  openReader: []
  openTextEditor: []
  random: []
  add: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="bank-header">
    <VBtn
      v-if="!props.isShowingCategories"
      icon
      variant="text"
      size="small"
      :aria-label="t('bank.back')"
      @click="emit('back')"
    >
      <VIcon>mdi-arrow-left</VIcon>
    </VBtn>
    <VIcon
      class="mr-2"
      color="primary"
    >
      {{ props.isShowingCategories ? 'mdi-folder' : 'mdi-message-text' }}
    </VIcon>
    <span class="text-subtitle-1 font-weight-medium">
      {{ props.isShowingCategories ? t('bank.categories') : t('bank.statements') }}
    </span>
    <VSpacer />

    <VBtn
      v-if="!props.isShowingCategories"
      :variant="props.isPasteMode ? 'flat' : 'outlined'"
      :color="props.isPasteMode ? 'secondary' : 'default'"
      size="small"
      class="mr-2"
      @click="emit('togglePasteMode')"
    >
      <VIcon start>
        mdi-content-paste
      </VIcon>
      {{ t('bank.pasteMode') }}
    </VBtn>

    <VBtn
      v-if="!props.isShowingCategories"
      icon
      variant="text"
      size="small"
      :aria-label="t('bank.reader')"
      @click="emit('openReader')"
    >
      <VIcon>mdi-book-open-variant</VIcon>
    </VBtn>

    <VBtn
      v-if="!props.isShowingCategories"
      icon
      variant="text"
      size="small"
      :aria-label="t('bank.textEditor')"
      @click="emit('openTextEditor')"
    >
      <VIcon>mdi-text-box-edit</VIcon>
    </VBtn>

    <VBtn
      v-if="!props.isShowingCategories"
      icon
      variant="text"
      size="small"
      color="accent"
      :aria-label="t('bank.random')"
      @click="emit('random')"
    >
      <VIcon>mdi-dice-multiple</VIcon>
    </VBtn>

    <VBtn
      icon
      variant="text"
      size="small"
      color="primary"
      :aria-label="props.isShowingCategories ? t('bank.addCategory') : t('bank.addStatement')"
      @click="emit('add')"
    >
      <VIcon>mdi-plus</VIcon>
    </VBtn>
  </div>
</template>

