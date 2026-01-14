<script setup lang="ts">
import { QWERTY_MAP } from '~/types'
import type { Category, Statement } from '~/types/api'

const props = defineProps<{
  items: (Category | Statement)[]
  isShowingCategories: boolean
}>()

const emit = defineEmits<{
  select: [item: Category | Statement]
  edit: [item: Category | Statement]
  delete: [item: Category | Statement]
  cache: [item: Category]
}>()

const { t } = useI18n()

const getShortcutKey = (index: number): string => {
  return QWERTY_MAP[index] || ''
}

const getItemLabel = (item: Category | Statement): string => {
  return 'label' in item ? item.label : item.text
}
</script>

<template>
  <VList
    v-if="props.items.length > 0"
    class="bank-list"
    :aria-label="props.isShowingCategories ? t('a11y.categoryList') : t('a11y.statementList')"
  >
    <VListItem
      v-for="(item, index) in props.items"
      :key="'id' in item ? item.id : index"
      class="list-item"
      :aria-keyshortcuts="getShortcutKey(index)"
      @click="emit('select', item)"
    >
      <template #prepend>
        <span class="item-number">{{ getShortcutKey(index) }}</span>
      </template>
      <VListItemTitle class="item-text">
        {{ getItemLabel(item) }}
      </VListItemTitle>
      <template #append>
        <VBtn
          v-if="props.isShowingCategories"
          icon
          variant="text"
          size="small"
          color="primary"
          :aria-label="t('bank.cacheCategory')"
          @click.stop="emit('cache', item as Category)"
        >
          <VIcon size="small">
            mdi-download
          </VIcon>
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          :aria-label="t('actions.edit')"
          @click.stop="emit('edit', item)"
        >
          <VIcon size="small">
            mdi-pencil
          </VIcon>
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          color="error"
          :aria-label="t('actions.delete')"
          @click.stop="emit('delete', item)"
        >
          <VIcon size="small">
            mdi-delete
          </VIcon>
        </VBtn>
      </template>
    </VListItem>
  </VList>

  <div
    v-else
    class="text-center pa-8 text-medium-emphasis"
  >
    {{ t('bank.empty') }}
  </div>
</template>

