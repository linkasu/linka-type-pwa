<template>
  <section>
    <overlay :active="showMode" @quit="toggle">
      <div v-if="!showMode">
        <predicator :value="text" @input="input" ref="predicator"/>
        <v-text-field
          ref="input"
          outlined="true"
          type="text"
          :value="text"
          @input="input"
          @keydown.66.meta.prevent="toggle"
          @keydown.49.50.51.52.53.54.meta.prevent="predict"
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
  input(value: String) {
    this.$emit("out", value);
  }
  areainput(event: any) {
    const textarea = <HTMLTextAreaElement>event.target;
    // if(textarea.offsetHeight, textarea.scrollHeight)

    this.$emit("out", textarea.value);
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
  predict(event:KeyboardEvent){
    console.log(this.$refs);
    
    (<Predicator>this.$refs.predicator).shortcut(event.keyCode-49);
    
  }
  created() {
    window.addEventListener("keydown", this.windowInput);
  }
  destroyed() {
    window.removeEventListener("keydown", this.windowInput);
  }
}
</script>


<style scoped>
textarea {
  position: absolute;
  width: 100%;
  height: 100%;
  color: #fff;
  background-color: #000;
  font-size: 10vh;
  border: 3px solid #fff;
}
</style>