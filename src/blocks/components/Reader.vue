<template>
  <div>
    <div class="filler group" ref="reader" tabindex="0" @blur="$event.target.focus()">
      <v-content>
        <v-expansion-panels>
          <v-expansion-panel
            v-for="(item,i) of items"
            :key="item.id"
            :class="{accent:i==page, success:i<page}"
          >
            <v-expansion-panel-header>{{i+1}}. {{item.text.split(' ').slice(0, 2).join(' ')}}</v-expansion-panel-header>
            <v-expansion-panel-content>{{item.text}}</v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-content>
      <v-footer absolute height="auto">
        <v-card flat tile width="100%" class="secondary lighten-1 text-center">
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
  page = 0;
  tts = TTS.instance;
  @Prop() items: { text: string }[] | undefined;

  windowInput(e: KeyboardEvent) {
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