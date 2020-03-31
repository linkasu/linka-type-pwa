<template>
  <v-form ref="form2">
          <v-btn
            x-large
            block
            color="success"
            @click="tts.say('Проверка озвучки, если вы слышите голос и вас всё устраивает, нажмите кнопку Дальше')"
          >Проверить озвучку</v-btn>
          
        </v-form>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { TTS } from "../../lib/TTS";

@Component
export default class VoiceSettings extends Vue {
  tts = TTS.instance;
  }
</script>