<template>
  <div>
    <l-header @show="showMode=true" @settings="settingsMode=!settingsMode" :settingsMode="settingsMode"/>
    <settings v-if="settingsMode" />
    <main v-else>
      <v-card-text>
        <main-input
          :showMode="showMode"
          v-model="textForSpeak"
          @say="say"
          @showMode="showMode=$event"
        />
        <v-btn block @click="say">Сказать</v-btn>
        <quickes></quickes>
      </v-card-text>
      <v-card-text>
        <bank />
      </v-card-text>
    </main>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import TTS from "../lib/TTS";

import LHeader from "./LHeader.vue";
import Bank from "./Bank.vue";
import Quickes from "./Quickes.vue";
import Settings from "./Settings.vue";
import MainInput from "./components/MainInput.vue";

@Component({
  components: {
    LHeader,
    Bank,
    MainInput,
    Quickes,
    Settings
  }
})
export default class MainUI extends Vue {
  textForSpeak: string = "";
  showMode: boolean = false;
  settingsMode = false;
  say() {
    TTS.instance.say(this.textForSpeak);
  }
}
</script>
