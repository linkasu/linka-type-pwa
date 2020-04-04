<template>
  <v-card raised :loading="questions.length==0" elevation-24>
    <v-card-title>
      <h3>Вопросы о вас:</h3>
    </v-card-title>
    <v-card-text>
      <v-form @submit.prevent="save()">
        <v-row v-for="q of questions" :key="q.uid">
          <v-text-field
            :label="q.label"
            persistent-hint
            dense
            filled
            shaped
            :hint="q.phrases[0].replace('%%', q.value)"
            :type="q.type"
            v-model="q.value"
          ></v-text-field>
        </v-row>
        <v-btn color="success" type="submit">Сохранить</v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Question } from "../../../functions/src/Question";

import Store from "@/lib/Store";
import fireapp from "@/lib/fireapp";
const NameProps = Vue.extend({
  props: {
    name: String
  }
});
@Component({
  props: {
    name: String
  },
  watch: {
    name(value) {
      if (!this.$data.questions) return value;
      const question = (<Question[]>this.$data.questions).find(
        item => item.uid === "name"
      );
      if (question) {
        question.value = value;
      }
    }
  }
})
export default class PhraseMaker extends NameProps {
  store = new Store();
  questions: Question[] = [];

  async save() {
    await fireapp.functions().httpsCallable("createStatement")({
      questions: this.questions
    });

    this.$emit("saved");
  }

  created() {
    this.store.factory
      .child("questions")
      .once("value")
      .then(snap => {
        const raw = snap.val();
        this.questions = [];
        for (const row of raw) {
          this.questions.push(
            new Question(
              row.uid,
              row.label,
              row.phrases,
              row.category,
              row.type
            )
          );
        }
      });
  }
}
</script>
