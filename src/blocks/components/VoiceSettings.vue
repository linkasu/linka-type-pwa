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
      <v-alert
        v-if="selectedVoiceDetails"
        type="info"
        dense
        outlined
        class="mt-2"
      >
        <div>Голос: <b>{{ selectedVoiceDetails.name }}</b></div>
        <div>Компания: {{ selectedVoiceDetails.vendor }}</div>
      </v-alert>
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

type YandexVoiceItem = {
  text: string;
  value: string;
  engine?: string;
  lang?: string;
  name?: string;
};

@Component({})
export default class VoiceSettings extends Vue {
  tts = TTS.instance;
  lc = LocalMemory.instance;
  voice: string = "";
  pitch: number = 1;
  rate: number = 1;
  volume: number = 1;
  yandex: boolean = false;
  yandexVoiceItems: YandexVoiceItem[] = [];
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
    this.yandexVoiceItems = this.tts.yandexVoices.map((item) => {
      const baseText = item.lang ? `${item.text} (${item.lang})` : item.text;
      const vendor = this.getVoiceVendorLabel(item.engine);
      return {
        value: item.voiceURI,
        text: `${baseText} — ${vendor}`,
        engine: item.engine,
        lang: item.lang,
        name: item.text
      };
    });
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

  get selectedVoiceDetails(): { name: string; vendor: string } | null {
    if (!this.voice) {
      return null;
    }

    if (this.yandex) {
      const voice = this.yandexVoiceItems.find((item) => item.value === this.voice);
      if (voice) {
        const displayName = voice.name || voice.text;
        const name = voice.lang ? `${displayName} (${voice.lang})` : displayName;
        return {
          name,
          vendor: this.getVoiceVendorLabel(voice.engine),
        };
      }
      return { name: this.voice, vendor: "Онлайн синтез" };
    }

    const offlineVoice = this.tts.offlineVoices.find((item) => item.voiceURI === this.voice);
    if (offlineVoice) {
      const name = offlineVoice.lang ? `${offlineVoice.name} (${offlineVoice.lang})` : offlineVoice.name;
      const vendor = offlineVoice.localService ? "Системный голос устройства" : "Голос браузера";
      return { name, vendor };
    }

    return null;
  }

  private getVoiceVendorLabel(engine?: string) {
    switch ((engine || "").toLowerCase()) {
      case "sber":
        return "Сбер";
      case "yandex":
        return "Яндекс";
      default:
        return "Онлайн синтез";
    }
  }

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
        text: `${item.name} от ${this.getOfflineVoiceVendorLabel(item)} (${item.lang})`,
        value: item.voiceURI
      }));
  }

  private getOfflineVoiceVendorLabel(voice: SpeechSynthesisVoice) {
    return voice.localService ? "устройство" : "браузер";
  }
}
</script>
