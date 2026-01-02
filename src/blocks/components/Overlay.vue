<template>
  <div :class="{overlay:active}" @click="click" @keydown="onKeydown" ref="overlay" tabindex="-1">
    <div class="content" ref="content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";

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
  private previouslyFocused: HTMLElement | null = null;

  mounted() {
    if (this.active) {
      this.activate();
    }
  }

  @Watch("active")
  onActiveChange(val: boolean) {
    if (val) this.activate();
    else this.deactivate();
  }

  activate() {
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.$nextTick(() => {
      const content = this.$refs.content as HTMLElement | undefined;
      const focusable = content?.querySelector<HTMLElement>(this.focusableSelector);
      if (focusable) focusable.focus();
      else (this.$refs.overlay as HTMLElement)?.focus();
    });
  }

  deactivate() {
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  get focusableSelector() {
    return 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
  }

  onKeydown(e: KeyboardEvent) {
    if (!this.active) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      this.$emit("quit");
      return;
    }
    if (e.key === "Tab") {
      const content = this.$refs.content as HTMLElement | undefined;
      const focusable = content?.querySelectorAll<HTMLElement>(this.focusableSelector);
      const first = focusable ? focusable[0] : null;
      const last = focusable ? focusable[focusable.length - 1] : null;
      if (!first || !last) {
        e.preventDefault();
        (this.$refs.overlay as HTMLElement)?.focus();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === this.$refs.overlay) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || document.activeElement === this.$refs.overlay) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

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