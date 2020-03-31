<template>
  <v-form >
    <v-btn
      x-large
      block
      color="success"
      @click="tts.say('Проверка озвучки, если вы слышите голос и вас всё устраивает, нажмите кнопку Дальше')"
    >Проверить озвучку</v-btn>
    
    <v-select :items="voices" v-model="voice" @change="setVoice" />
    <v-slider step='0.1' nin="0" max="2" v-model="pitch" label="Тональность голоса" />
    <v-slider step='0.1' min="0.1" max="2" v-model="rate" label="Скорость голоса" />
    <v-slider step='0.1' min="0" max="1" v-model="volume" label="Громскость голоса" />
  </v-form>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import TTS from "../../lib/TTS";
import LocalMemory from "../../lib/LocalMemory";

@Component({
  watch:{
    rate(value){
      
      TTS.instance.rate = value
    },
    pitch(value){
      
      TTS.instance.pitch = value
    },
    volume(value){
      
      TTS.instance.volume = value
    }
  }
})
export default class VoiceSettings extends Vue {
  tts = TTS.instance;
  lc = LocalMemory.instance;
  voice: string = "";
  pitch: number = 1;
  rate: number = 1;
  volume: number = 1;

  mounted() {
    this.voice = this.tts.selectedOfflineVoice.voiceURI;
    this.pitch = this.tts.pitch;
    this.rate = this.tts.rate;
    this.volume = this.tts.volume;
  }
  setVoice(uri: string) {
    this.tts.setVoice(uri);
  }
  get voices() {
    let ruvoices = this.tts.offlineVoices.filter(item => {
      return item.lang.includes("ru");
    });
    let notruvoices = this.tts.offlineVoices.filter(item => {
      return !item.lang.includes("ru");
    });
    return [...ruvoices, ...notruvoices].map(item => ({
      text: item.name + " (" + item.lang + ")",
      value: item.voiceURI
    }));
  }
}
</script>