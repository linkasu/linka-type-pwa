<template>
  <div :class="{overlay:active}" @click="click">
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
  name: "Overlay",
  props: {
    active: {
      type: Boolean,
      default: false
    }
  },
  model: {
    prop: "active",
    event: "quit"
  }
})
export default class Overlay extends Vue {
  click(e: PointerEvent) {
    if (!e.target) return;
    if ((<Element>e.target).classList.contains("overlay")) {
      this.$emit("quit");
    }
  }
}
</script>

<style  scoped>
.overlay {
  position: fixed;
  left: 0;

  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.9); /* Black w/opacity/see-through */

  cursor: pointer;
  z-index: 101;
}
.overlay > .content {
  border-radius: 5px;
  cursor: initial;
  background: white;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 80%;
  height: 60%;
  line-height: 1em;
  transform: translate(-50%, -50%);
}
</style>