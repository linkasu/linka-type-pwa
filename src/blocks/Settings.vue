<template>
  <v-container>
    <v-switch class="ma-2" v-model="darkTheme" label="Темная тема"></v-switch>
    <v-tabs v-model="tab" background-color="accent-4" center-active dark centered>
      <v-tab>Выбор голоса</v-tab>
      <v-tab>Адаптация интерфейса</v-tab>
      <v-tab>Импорт готовых категорий</v-tab>
      <v-tab>Передача на экран</v-tab>
    </v-tabs>
    <v-card>
      <voice-settings v-if="tab===0" />
      <adaptive-settings v-else-if="tab===1" />
      <import-global v-else-if="tab===2" />
    </v-card>
  </v-container>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VoiceSettings from "./components/VoiceSettings.vue";
import AdaptiveSettings from "./components/AdaptiveSettings.vue";
import ImportGlobal from "./components/ImportGlobal.vue";
import LocalMemory from "../lib/LocalMemory";
import { Watch } from "vue-property-decorator";

@Component({
  components: { VoiceSettings, AdaptiveSettings, ImportGlobal }
})
export default class Settings extends Vue {
  tab = 0;
  lc = LocalMemory.instance;
  darkTheme: boolean = !!this.lc.getBoolean("darkTheme", false);

  @Watch("darkTheme")
  onDarkTheme(value: boolean) {
    this.$vuetify.theme.dark = value;
    this.lc.setBoolean("darkTheme", value);
  }

  mounted() {
    this.$vuetify.theme.dark = this.darkTheme;
  }
}
</script>
