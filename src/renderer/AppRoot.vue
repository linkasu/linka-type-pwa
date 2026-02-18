<script setup lang="ts">
import DefaultLayout from '~/layouts/default.vue'
import AuthLayout from '~/layouts/auth.vue'
import AppLayout from '~/layouts/app.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  const layout = route.meta.layout
  if (layout === false) return null
  if (layout === 'auth') return AuthLayout
  if (layout === 'app') return AppLayout
  return DefaultLayout
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layoutComponent" v-if="layoutComponent">
      <component :is="Component" />
    </component>
    <component :is="Component" v-else />
  </RouterView>
</template>
