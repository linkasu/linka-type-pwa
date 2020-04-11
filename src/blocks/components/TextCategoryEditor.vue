<template>
  <div>
    <overlay  active ref="overlay" fixed @quit="$emit('quit')">
      <textarea v-model="text" ref="textarea"/>
      <v-btn absolute dark fab bottom right color="pink" @blur="$refs.textarea.focus()" @click="$emit('save', text.split('\n')); $emit('quit')">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
    </overlay>
  </div>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Overlay from "./Overlay.vue";
import { Statement } from "../../lib/Statement";
import { Prop, Watch } from "vue-property-decorator";

@Component({
  components: {
    Overlay
  }
})
export default class TextCategoryEditor extends Vue {

  text = "";
  @Prop() items: Statement[] | undefined;
  mounted(){
    if ( this.items) {
      this.text = this.items.map(item => item.text).join("\n");
      setTimeout(() => {
        (<HTMLElement>this.$refs.textarea).focus();
      }, 0);
    }
  }
}
</script>

<style scoped>
textarea {
  position: absolute;
  width: 100%;
  height: 100%;
  font-size: 2.5vh;
  border: 3px solid #000;
  resize: none;
  line-height: 1em;
}
</style>