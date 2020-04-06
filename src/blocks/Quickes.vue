<template>
  <div width="100%" tabindex="0" class="quickes group" @keydown="keydown">
    <button-row :items="phrases" :focus="false" @buttonclick="say" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import fireapp from "../lib/fireapp";
import Store from "../lib/Store";
import TTS from "../lib/TTS";
import ButtonRow from "./components/ButtonRow.vue";

const store = new Store();

@Component({
  components: {
    ButtonRow
  }
})
export default class Quickes extends Vue {
  phrases: string[] = new Array(6);
  say(phrase: string) {
    TTS.instance.say(phrase);
  }

  keydown(e: KeyboardEvent) {
    if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
      this.say(this.phrases[+e.key - 1]);
    }
  }

  async load() {
    if (!store.root) return;
    const ref = store.root.child("quickes");
    if (!(await ref.once("value")).exists()) {
      await this.create(ref);
    }
    ref.on("value", snap => {
      const arr = snap.val();
      // for (const key in arr) {
      //   const element = arr[key];
      //   this.phrases[parseInt(key)] = arr[key];
      // }
      this.phrases = arr;
    });
  }
  async create(ref: fireapp.database.Reference) {
    await ref.set([
      "Привет",
      "Как дела?",
      "Да",
      "Нет",
      "Подождите",
      "Я пишу ответ"
    ]);
  }
  created() {
    this.load();

    window.addEventListener("keydown", e => {
      if (e.code === "Digit0"&&e.metaKey) {
        (<HTMLInputElement>this.$el).focus();
      }
    });
  }
}
</script>
