<template>
  <div>
    <l-header
      @show="showMode=true"
      @settings="settingsMode=!settingsMode"
      :settingsMode="settingsMode"
    />
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
        <quickes v-if="isQuickes" />
      </v-card-text>
      <v-card-text>
        <bank v-if="isBank" />
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
import LocalMemory from "../lib/LocalMemory";
import { Watch } from 'vue-property-decorator';

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
  lc = LocalMemory.instance
  textForSpeak: string = "";
  showMode: boolean = false;
  settingsMode = false;
  isQuickes = true;
  isBank = true;
  @Watch('settingsMode') onSettingsMode(value:boolean){
    if(!value){
    this.isQuickes = !!this.lc.getBoolean("quickes", true);
    this.isBank = !!this.lc.getBoolean("bank", true);
    }
  }
  say() {
    TTS.instance.say(this.textForSpeak);
  }
  created() {
    const lc = LocalMemory.instance;
    this.isQuickes = !!lc.getBoolean("quickes", true);
    this.isBank = !!lc.getBoolean("bank", true);
  }
}
</script>
