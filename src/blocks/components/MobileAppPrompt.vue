<template>
  <v-dialog v-model="isDialogVisible" max-width="360" persistent>
    <v-card>
      <v-card-title class="headline font-weight-bold">
        Скачать Linka
      </v-card-title>
      <v-card-text>
        <p>
          Мы заметили, что вы пользуетесь Linka на мобильном устройстве.
          Для лучшего опыта рекомендуем установить нативное приложение.
        </p>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="flex-column pa-4">
        <v-btn
          v-if="showAppStore"
          block
          color="primary"
          class="mb-3"
          @click="openLink(appStoreUrl)"
        >
          Скачать в App Store
        </v-btn>
        <v-btn
          v-if="showPlayStore"
          block
          color="success"
          class="mb-3"
          @click="openLink(playStoreUrl)"
        >
          Скачать в Google Play
        </v-btn>
        <v-btn text block color="secondary" @click="dismiss">
          Продолжить в браузере
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import LocalMemory from "../../lib/LocalMemory";

@Component
export default class MobileAppPrompt extends Vue {
  private readonly storage = LocalMemory.instance;
  private readonly storageKey = "mobileAppPromptDismissed";
  private isDialogVisible = false;
  readonly appStoreUrl = "https://apps.apple.com/us/app/linka-%D0%BD%D0%B0%D0%BF%D0%B8%D1%88%D0%B8/id6754614216";
  readonly playStoreUrl = "https://play.google.com/store/apps/details?id=ru.ibakaidov.distypepro&hl=ru";

  mounted() {
    if (typeof window === "undefined") {
      return;
    }

    const wasDismissed = this.storage.getBoolean(this.storageKey, false) === true;
    if (wasDismissed) {
      return;
    }

    if (this.isMobileDevice && !this.isStandaloneExperience) {
      this.isDialogVisible = true;
    }
  }

  get showAppStore(): boolean {
    return this.isIOS;
  }

  get showPlayStore(): boolean {
    return this.isAndroid;
  }

  private get isMobileDevice(): boolean {
    return this.isIOS || this.isAndroid;
  }

  private get isIOS(): boolean {
    if (typeof navigator === "undefined") {
      return false;
    }
    return /iPad|iPhone|iPod/i.test(navigator.userAgent);
  }

  private get isAndroid(): boolean {
    if (typeof navigator === "undefined") {
      return false;
    }
    return /Android/i.test(navigator.userAgent);
  }

  private get isStandaloneExperience(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const navigatorAny = navigator as Navigator & { standalone?: boolean };
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      navigatorAny.standalone === true
    );
  }

  openLink(url: string) {
    window.open(url, "_blank");
    this.dismiss();
  }

  dismiss() {
    this.isDialogVisible = false;
    this.storage.setBoolean(this.storageKey, true);
  }
}
</script>

<style scoped>
.v-card-text p {
  margin-bottom: 0;
}
</style>
