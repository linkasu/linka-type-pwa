<template>
  <section>
    <audio src="/sounds/type.wav" ref="type"></audio>
    <overlay :active="showMode" @quit="toggle">
      <div v-if="!showMode">
        <predicator
          :value="text"
          @input="input"
          ref="predicator"
          v-if="showPredicator"
          :register="holdCMD?register:null"
        />
        <v-text-field
          ref="input"
          type="text"
          color="accent"
          :value="text"
          @input="input"
          @keydown.66.meta.prevent="toggle"
          @keydown.8.meta="input('')"
          @keydown="fieldInput($event)"
          @keydown.enter.prevent="$emit('say')"
        ></v-text-field>
      </div>
      <textarea
        v-else
        ref="textarea"
        @keydown.enter.meta="$emit('say')"
        block
        @input="areainput"
        @keydown.esc="toggle"
        @keydown.66.meta="toggle"
        @blur="$refs.textarea.focus()"
        :value="text"
      ></textarea>
    </overlay>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Overlay from "./Overlay.vue";
import Predicator from "./Predicator.vue";
import LocalMemory from "../../lib/LocalMemory";
import TTS from "../../lib/TTS";

@Component({
  components: {
    Overlay,
    Predicator
  },
  props: {
    showMode: Boolean,
    text: String
  },
  model: {
    prop: "text",
    event: "out"
  }
})
export default class MainInput extends Vue {
  showPredicator: boolean | null = null;
  prevText = "";
  wordsCount = 0;
  holdCMD: boolean | null = LocalMemory.instance.getBoolean("holdCMD", false);
  register = false;
  input(value: string) {
    const readLastWord = LocalMemory.instance.getBoolean("readLastWord", false);

    if (readLastWord === null) {
    } else if (!readLastWord) {
      const typeAudio = <HTMLAudioElement>this.$refs.type;
      typeAudio.pause();
      typeAudio.currentTime = 0;
      typeAudio.play();
    } else {
      if (value.indexOf(this.prevText) !== 0) {
        this.wordsCount = 0;
      }
      if (value[value.length - 1] === " ") {
        const words = value.trim().split(" ");

        if (words.length > this.wordsCount) {
          const before = words[words.length - 2];

          TTS.instance.say(
            (before && before.length < 4 ? before : "") +
              " " +
              words[words.length - 1]
          );
        }

        this.wordsCount = words.length;
      }
    }
    this.prevText = value;
    this.$emit("out", value);
  }
  areainput(event: any) {
    const textarea = <HTMLTextAreaElement>event.target;
    // if(textarea.offsetHeight, textarea.scrollHeight)

    this.$emit("out", textarea.value);
  }

  fieldInput(event: KeyboardEvent) {
    if (this.holdCMD && ["Meta", "Control"].includes(event.key)) {
      this.register = !this.register;
      event.preventDefault();
      return false;
    }
    if (
      event.metaKey ||
      (this.register &&
        this.holdCMD &&
        [49, 50, 51, 52, 53, 54].includes(event.keyCode))
    ) {
      (<Predicator>this.$refs.predicator).shortcut(event.keyCode - 49);

      this.register = false;
      event.preventDefault();
      return false;
    }
  }
  windowInput(event: KeyboardEvent) {
    if (event.target === this.$refs.input) {
      if (event.code === "Escape") {
        (<HTMLElement>this.$refs.input).blur();
      }
    } else {
      if (event.code === "KeyI") {
        this.awaitFocus("input");

        return false;
      }
    }
  }
  toggle() {
    console.log(this);

    if ((<any>this).showMode) {
      this.$emit("showMode", false);

      this.awaitFocus("input");
    } else {
      this.$emit("showMode", true);
      this.awaitFocus("textarea");
    }
  }
  awaitFocus(element: string) {
    setTimeout(() => {
      (<HTMLElement>this.$refs[element]).focus();
    }, 100);
  }
  created() {
    window.addEventListener("keydown", this.windowInput);
    this.showPredicator = LocalMemory.instance.getBoolean("predicator", true);
    this.holdCMD = LocalMemory.instance.getBoolean("holdCMD", false);
  }
  destroyed() {
    window.removeEventListener("keydown", this.windowInput);
  }
}
</script>


<style scoped>
textarea {
  resize: none;
  position: absolute;
  width: 100%;
  height: 100%;
  color: #fff;
  background-color: #000;
  font-size: 10vh;
  line-height: 1em;
  border: 3px solid #fff;
}
</style>