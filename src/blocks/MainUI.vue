<template>
  <div>
    <l-header @show="showMode=true" />
    <main>
      <v-card-text>
        <overlay :active="showMode" @quit="showMode=false">
          <v-text-field
            outlined="true"
            type="text"
            v-model="textForSpeak"
            @keydown.enter.prevent="say"
            :style="{'font-size':showMode?'10vh':'inherit'}"
            :dark="showMode"
          ></v-text-field>
        </overlay>
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

import { TTS } from "../lib/TTS";

import LHeader from "./LHeader.vue";
import Bank from "./Bank.vue";
import Quickes from "./Quickes.vue";
import Overlay from "./components/Overlay.vue";

@Component({
  components: {
    LHeader,
    Bank,
    Overlay,
    Quickes
  }
})
export default class MainUI extends Vue {
  textForSpeak: string = "";
  showMode: boolean = false;
  say() {
    TTS.instance.say(this.textForSpeak);
  }
}
</script>
