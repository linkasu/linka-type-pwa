<template>
  <div>
    <v-btn v-if="!show" @click="show=true" icon>
      <v-icon>mdi-playlist-music</v-icon>
    </v-btn>
    <div v-else class="filler group" ref="reader" tabindex="0" @blur="$event.target.focus()">
      <v-content>
        <v-expansion-panel>
          <v-expansion-panel-content
            v-for="(item, i) of items"
            :key="item.id"
            :class="{primary:i==page, success:i<page}"
          >
            <template v-slot:header>
              <div>{{item.text.split(' ').slice(0,2).join(' ')}}</div>
            </template>
            <v-card>
              <v-card-text>{{item.text}}</v-card-text>
            </v-card>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-content>
      <v-footer absolute height="auto">
        <v-card flat tile width="100%" class="cyan lighten-1 text-center">
          <v-card-text>
            <v-btn :disabled="page<=0" @click="prev()">
              <v-icon>mdi-chevron-left</v-icon>(z)
            </v-btn>
            <v-btn @click="stop()">
              <v-icon>mdi-stop</v-icon>(S)
            </v-btn>
            <v-btn disabled>{{page+1}}/{{items.length}}</v-btn>
            <v-btn @click="say()">
              (p)
              <v-icon>mdi-play</v-icon>
            </v-btn>
            <v-btn :disabled="page>=items.length-1" @click="next()">
              (m)
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-text>
          <v-btn right icon absolute top justify-center @click="show=false">
            <v-icon color="red">mdi-close</v-icon>
          </v-btn>
        </v-card>
      </v-footer>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Overlay from "./Overlay.vue";
import { Prop, Watch } from "vue-property-decorator";
import TTS from "@/lib/TTS";

@Component({
  components: {
    Overlay
  }
})
export default class Reader extends Vue {
  show = false;
  page = 0;
  tts = TTS.instance;
  @Prop() items: { text: string }[] | undefined;
  @Watch("show") onShow(value: boolean) {
    if (value) {
      setTimeout(() => {
        (<HTMLDivElement>this.$refs.reader).focus();
      }, 100);
    }
    return value;
  }

  windowInput(e: KeyboardEvent) {
    if (!this.$refs.reader) {
      this.show = false;
    }
    if (this.show) {
      (<HTMLElement>this.$refs.reader).focus();
      switch (e.keyCode) {
        case 90:
          this.prev();
          break;
        case 77:
          this.next();
          break;
        case 80:
          this.say();
          break;
        case 83:
          this.stop();
          break;
        default:
          break;
      }
    }
  }
  prev() {
    if (this.page > 0) this.page--;
  }
  next() {
    if (this.page < this.items!.length - 1) {
      this.page++;
    }
  }
  say() {
    this.tts.say(this.items![this.page].text);
  }
  stop() {
    this.tts.stop();
  }
  created() {
    window.addEventListener("keydown", this.windowInput);
  }
  distroy() {
    window.removeEventListener("keydown", this.windowInput);
  }
}
</script>

<style scoped>
.filler {
  left: 0;
  position: fixed;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1001;
  background-color: #fff;
}
</style>