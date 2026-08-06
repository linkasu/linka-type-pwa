<script setup lang="ts">
import PrivacyNotice from '~/components/PrivacyNotice.vue'

const { t } = useI18n()
</script>

<template>
  <VApp>
    <VMain class="auth-layout">
      <PrivacyNotice />
      <VContainer
        fluid
        class="auth-container"
      >
        <VRow
          align="center"
          justify="center"
          class="auth-row"
        >
          <VCol
            cols="12"
            md="6"
            lg="4"
          >
            <VCard
              class="auth-card pa-6"
              elevation="8"
            >
              <VCardTitle class="text-center mb-4">
                <div class="text-h4 font-weight-bold text-primary">
                  {{ t('app.name') }}
                </div>
                <div class="text-body-2 text-medium-emphasis mt-2">
                  {{ t('app.description') }}
                </div>
              </VCardTitle>
              <VCardText>
                <slot />
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </VMain>
  </VApp>
</template>

<style scoped>
.auth-layout {
  background: linear-gradient(135deg, #197377 0%, #bed64f 100%);
  min-height: 100dvh;
  overflow-y: auto;
}

.auth-container,
.auth-row {
  min-height: 100%;
}

@media (max-height: 700px) {
  .auth-container {
    padding-block: 16px;
  }

  .auth-row {
    align-items: flex-start !important;
  }

  .auth-card {
    padding: 16px !important;
  }
}
</style>
