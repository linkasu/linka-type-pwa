<template>
  <v-container fill-height>

      <v-overlay :value="loading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>

    <v-responsive>
      <v-card>
        <v-card-text>
          <v-text-field
            v-model="query"
            label="Введите запрос к нейросети"
            type="text"
            no-details
            outlined
            append-outer-icon="send"
            @keyup.enter="send"
            @click:append-outer="send"
            hide-details
          />
        </v-card-text>
        <v-card-text>
          <v-card elevation-3 v-if="!!response">
            <v-toolbar dark color="blue" class="lighten-3">
              <v-toolbar-title class="">Ответ нейросети</v-toolbar-title>
              <v-spacer/>
              <v-btn @click="$emit('quit', response)">
                Вставить в поле ввода.
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <div class="quote mb-3">{{ response }}</div>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </v-responsive>
  </v-container>
</template>


<script lang="ts">
import fireapp from "@/lib/fireapp";
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component({})
export default class Brain extends Vue {
  query = "";
  response: string|null = null;
  loading = false;
  async send() {
    if(this.loading) return;
    this.loading = true;
    try {
      const { data } = await fireapp.functions().httpsCallable("chatbot")({
        phrase: this.query,
      });
      const { text } = data;
      this.response = text;
    } catch (error) {
    } finally {
      this.loading = false;
    }
  }
}
</script>
