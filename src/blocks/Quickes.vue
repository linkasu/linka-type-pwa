<template>
  <div width="100%" tabindex="0" class="quickes" @keydown="keydown">
    <v-layout>
      <v-flex xs6 md2 v-for="(n, i) of phrases" :key="n">
        <v-badge color="primary" overlap width="100%" bottom left>
          <span slot="badge">{{i+1}}</span>
          <!--slot can be any component-->
          <v-btn block @click="say(n)" tabindex="-1">{{n}}</v-btn>
        </v-badge>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import fireapp from "../lib/fireapp";
import Store from "../lib/Store";
import TTS from "../lib/TTS";

const store = new Store();

@Component
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
  mounted() {
    this.load();

    window.addEventListener("keydown", e => {
      if (
        e.code === "KeyQ" &&
        !["input", "textarea"].includes(
          (<Element>e.target).tagName.toLowerCase()
        )
      ) {
        (<HTMLInputElement>this.$el).focus();
      }
    });
  }
}
</script>

<style scoped>
.quickes:focus {
  background: #ff5252;
}
.layout {
  flex-wrap: wrap;
}
.v-badge {
  width: 100%;
}
</style>