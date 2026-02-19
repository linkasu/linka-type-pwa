<script setup lang="ts">
import type { DialogChat } from '~/types/api'

const props = defineProps<{
  chats: DialogChat[]
  activeChatId: string | null
  isLoadingChats: boolean
}>()

const emit = defineEmits<{
  createChat: []
  selectChat: [chatId: string]
  deleteChat: [chatId: string]
}>()

const { t, locale } = useI18n()

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <VCard class="chat-list">
    <VCardTitle class="d-flex align-center">
      {{ t('chat.chatsTitle') }}
      <VSpacer />
      <VBtn
        icon
        variant="text"
        :aria-label="t('chat.newChat')"
        @click="emit('createChat')"
      >
        <VIcon>mdi-plus</VIcon>
      </VBtn>
    </VCardTitle>

    <VDivider />

    <VCardText class="chat-list-body">
      <VProgressCircular
        v-if="isLoadingChats"
        indeterminate
        color="primary"
        size="32"
        class="my-4"
      />

      <VList
        v-else
        nav
        density="comfortable"
        class="chat-list-items"
      >
        <VListItem
          v-for="chat in props.chats"
          :key="chat.id"
          :active="chat.id === props.activeChatId"
          @click="emit('selectChat', chat.id)"
        >
          <VListItemTitle>{{ chat.title || t('chat.untitled') }}</VListItemTitle>
          <VListItemSubtitle>
            <span v-if="chat.lastMessageAt">
              {{ formatTime(chat.lastMessageAt) }}
            </span>
            <span v-else>
              {{ t('chat.emptyChat') }}
            </span>
          </VListItemSubtitle>
          <template #append>
            <VBtn
              icon
              variant="text"
              size="small"
              class="chat-delete-btn"
              :aria-label="t('actions.delete')"
              @click.stop="emit('deleteChat', chat.id)"
            >
              <VIcon size="small">mdi-trash-can-outline</VIcon>
            </VBtn>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped>
.chat-list-body {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.chat-delete-btn {
  opacity: 0.4;
  transition: opacity 0.2s;
}

.chat-delete-btn:hover {
  opacity: 1;
  color: rgb(var(--v-theme-error));
}

@media (max-width: 959px) {
  .chat-list-body {
    max-height: 30vh;
  }
}
</style>
