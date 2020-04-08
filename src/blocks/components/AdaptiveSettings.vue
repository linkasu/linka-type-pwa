<template>
  <v-form>
    <v-checkbox label="Использовать угадыватель слов яндекс" v-model="predicator"></v-checkbox>
  </v-form>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import TTS from "../../lib/TTS";
import LocalMemory from "../../lib/LocalMemory";
import { Watch } from "vue-property-decorator";

@Component
export default class AdaptiveSettings extends Vue {
  lc = LocalMemory.instance;
  predicator: boolean = this.lc.getBoolean("predicator", true);
  @Watch("predicator") onPredicator(value: boolean) {
    this.lc.setBoolean("predicator", value);
  }
  created() {}
}
</script>