<script setup lang="ts">
const { t } = useI18n()

useHead({
  titleTemplate: (title) => title ? `${title} - ${t('app.name')}` : t('app.name'),
  htmlAttrs: {
    lang: 'ru',
  },
})
</script>

<template>
  <VApp>
    <a
      href="#main-content"
      class="skip-nav"
    >
      {{ t('a11y.skipNav') }}
    </a>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </VApp>
</template>

<style>
html {
  overflow-y: auto;
}
</style>
