<template>
  <v-container grid-list-xs>
    <v-form>
         <p>
            <b>Внимание!</b> Если у вас iOS устройство, включите звук уведомлений, иначе ничего не услышите.
          </p>
      <v-btn
        x-large
        block
        color="accent"
        @click="tts.say('Проверка озвучки, если вы слышите голос и вас всё устраивает, нажмите кнопку Дальше')"
      >Проверить озвучку</v-btn>

      <v-checkbox label="Использовать голоса яндекс" v-model="yandex"></v-checkbox>

      <v-select :items="voices" v-model="voice" @change="setVoice" label="Голос"/>
      <v-slider
        v-if="!yandex"
        step="0.1"
        nin="0"
        max="2"
        v-model="pitch"
        label="Тональность голоса"
      />
      <v-slider step="0.1" min="0.1" max="2" v-model="rate" label="Скорость голоса" />
      <v-slider
        v-if="!yandex"
        step="0.1"
        min="0"
        max="1"
        v-model="volume"
        label="Громкость голоса"
      />
    </v-form>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import TTS from "../../lib/TTS";
import LocalMemory from "../../lib/LocalMemory";
import { Watch } from "vue-property-decorator";

@Component({})
export default class VoiceSettings extends Vue {
  tts = TTS.instance;
  lc = LocalMemory.instance;
  voice: string = "";
  pitch: number = 1;
  rate: number = 1;
  volume: number = 1;
  yandex: boolean = false;
  yandexVoiceItems: { text: string; value: string }[] = [];
  @Watch("rate") onRate(value: number) {
    this.tts.rate = value;
  }
  @Watch("pitch") onPitch(value: number) {
    this.tts.pitch = value;
  }
  @Watch("volume") onVolume(value: number) {
    this.tts.volume = value;
  }
  @Watch("yandex") onYandex(value: boolean) {
    this.tts.yandex = value;
    if (value) {
      if (this.yandexVoiceItems.length === 0) {
        this.refreshYandexVoices();
      }

      const firstYandexVoice = this.yandexVoiceItems[0];
      if (firstYandexVoice) {
        this.voice = firstYandexVoice.value;
        this.tts.setVoice(this.voice);
      }
    } else {
      // При отключении Яндекса возвращаемся к выбранному офлайн голосу
      const selectedVoice = this.tts.selectedVoice;
      if (selectedVoice) {
        this.voice = selectedVoice.voiceURI;
        this.tts.setVoice(this.voice);
      }
    }
  }

  created() {
    const selectedVoice = this.tts.selectedVoice;
    if (selectedVoice) {
      this.voice = selectedVoice.voiceURI;
    }
    this.pitch = this.tts.pitch;
    this.rate = this.tts.rate;
    this.volume = this.tts.volume;
    this.yandex = this.tts.yandex;
    this.refreshYandexVoices();
    this.tts.events.on("yandex-voices-updated", this.onYandexVoicesUpdated);
  }
  beforeDestroy() {
    this.tts.events.off("yandex-voices-updated", this.onYandexVoicesUpdated);
  }
  setVoice(uri: string) {
    this.tts.setVoice(uri);
  }
  refreshYandexVoices() {
    this.yandexVoiceItems = this.tts.yandexVoices.map((item) => ({
      value: item.voiceURI,
      text: item.lang ? `${item.text} (${item.lang})` : item.text
    }));
  }

  private onYandexVoicesUpdated = () => {
    const previousVoice = this.voice;
    this.refreshYandexVoices();

    if (this.yandex && this.yandexVoiceItems.length > 0) {
      const matched = this.yandexVoiceItems.find((item) => item.value === previousVoice);
      const nextVoice = matched || this.yandexVoiceItems[0];
      if (nextVoice && nextVoice.value !== this.voice) {
        this.voice = nextVoice.value;
        this.tts.setVoice(this.voice);
      }
    }
  };

  get voices(): { text: string; value: string }[] {
    if (this.yandex) {
      if (this.yandexVoiceItems.length === 0) {
        this.refreshYandexVoices();
      }

      return this.yandexVoiceItems;
    }

    return this.tts.offlineVoices
      .sort((a, b) => {
        return a.lang.includes("ru") === b.lang.includes("ru")
          ? 0
          : a.lang.includes("ru")
          ? -1
          : 1;
      })
      .map(item => ({
        text: item.name + " (" + item.lang + ")",
        value: item.voiceURI
      }));
  }
}
</script>
