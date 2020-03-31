<template>
  <v-layout>
    <v-flex xs3 v-for="n of phrases" :key="n">
      <v-btn block @click="say(n)">{{n}}</v-btn>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import fireapp from "../lib/fireapp";
import Store from "../lib/Store";
import { TTS } from "../lib/TTS";

const store = new Store();

@Component
export default class Quickes extends Vue {
  phrases: string[] = new Array(6);
  say(phrase:string) {
    TTS.instance.say(phrase);
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
      this.phrases = arr  ;
      
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
  }
}
</script>
