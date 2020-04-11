<template>
  <v-container>
    <v-tabs v-model="tab" background-color="accent-4" center-active dark centered>
      <v-tab>Выбор голоса</v-tab>
      <v-tab>Адаптация интерфейса</v-tab>
      <v-tab>Передача на экран</v-tab>
    </v-tabs>
    <v-card>
      <voice-settings v-if="tab===0"/>
      <adaptive-settings v-else-if="tab===1"/>
    </v-card>
  </v-container>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VoiceSettings from "./components/VoiceSettings.vue";
import AdaptiveSettings from "./components/AdaptiveSettings.vue";

@Component({
  components: { VoiceSettings, AdaptiveSettings }
})
export default class Settings extends Vue {
  tab = 0;
}
</script>
