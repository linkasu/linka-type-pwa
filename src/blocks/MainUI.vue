<template>
  <div>
    <l-header
      @show="showMode=true"
      @shortcut="shortcutMode=true"
      @settings="settingsMode=!settingsMode"
      :settingsMode="settingsMode"
      :chat="chat"
      @chat="chat=$event"
      @tutorial="tutorialMode=true"
    />
    <tutorial v-if="tutorialMode" @close="tutorialMode=false;lc.setBoolean('tutorial', false)" />
    <shortcut-list v-if="shortcutMode" @close="shortcutMode=false" />
    <settings v-if="settingsMode" />
    <main v-else>
      <v-card-text>
        <main-input
          :showMode="showMode"
          v-model="textForSpeak[chat]"
          @say="say"
          @showMode="showMode=$event"
        />

        <v-btn block @click="say">Сказать</v-btn>
      </v-card-text>
      <v-card-text>
        <quickes v-if="isQuickes" />
      </v-card-text>
      <v-card-text>
        <bank v-if="isBank" @paste="paste" />
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
import Tutorial from "./Tutorial.vue";
import Quickes from "./Quickes.vue";
import Settings from "./Settings.vue";
import MainInput from "./components/MainInput.vue";
import ShortcutList from "./ShortcutList.vue";
import LocalMemory from "../lib/LocalMemory";
import { Watch } from "vue-property-decorator";
import { analytics } from "firebase";

@Component({
  components: {
    LHeader,
    Bank,
    MainInput,
    Quickes,
    Settings,
    Tutorial,
    ShortcutList
  }
})
export default class MainUI extends Vue {
  lc = LocalMemory.instance;
  textForSpeak: string[] = ["", "", ""];
  showMode: boolean = false;
  settingsMode = false;
  shortcutMode = false;
  isQuickes = true;
  isBank = true;
  tutorialMode = this.lc.getBoolean("tutorial", true);

  chat = 0;
  @Watch("settingsMode") onSettingsMode(value: boolean) {
    if (!value) {
      this.isQuickes = !!this.lc.getBoolean("quickes", true);
      this.isBank = !!this.lc.getBoolean("bank", true);
    }
  }
  say() {
    analytics().logEvent("say");

    TTS.instance.say(this.textForSpeak[this.chat]);
  }
  paste(event: string) {
    this.textForSpeak[this.chat] = this.textForSpeak[this.chat] + " " + event;

    //dont ask, it needs
    this.chat++;
    setTimeout(() => {
      this.chat--;
    }, 0);
  }
  windowInput(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) {
      if (event.keyCode === 38) {
        this.chat = this.chat === 0 ? 2 : this.chat - 1;
      } else if (event.keyCode === 40) {
        this.chat = this.chat === 2 ? 0 : this.chat + 1;
      }
    }
  }
  created() {
    const lc = LocalMemory.instance;
    this.isQuickes = !!lc.getBoolean("quickes", true);
    this.isBank = !!lc.getBoolean("bank", true);
    window.addEventListener("keydown", this.windowInput);

    console.log(this);
  }
}
</script>
