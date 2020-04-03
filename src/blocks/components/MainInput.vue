<template>
  <section>
    <overlay :active="showMode" @quit="$emit('showMode', false)">
      <v-text-field
        ref="input"
        outlined="true"
        type="text"
        :value="text"
        @input="input"
        @keydown.enter.prevent="$emit('say')"

      ></v-text-field>
    </overlay>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Overlay from "./Overlay.vue";

@Component({
  components: {
    Overlay
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
  windowInput(event: KeyboardEvent) {
    
    if (event.target === this.$refs.input) {
      if(event.code==='Escape'){
        (<HTMLElement> this.$refs.input).blur()
      }
    } else {
      if (event.code === "KeyI") {
        setTimeout(() => {
          (<HTMLElement>this.$refs.input).focus();
        }, 0); 
        return false
      }
    }
  }
  mounted() {
    window.addEventListener("keydown", this.windowInput);
  }
  destroyed() {
    window.removeEventListener("keydown", this.windowInput);
  }
}
</script>
