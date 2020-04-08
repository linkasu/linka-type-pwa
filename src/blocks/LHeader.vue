<template>
  <header>
    <v-toolbar>
      <v-toolbar-title>{{settingsMode?'Настройки':'LINKa. Напиши'}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items v-if="!settingsMode">
        <v-btn flat @click="$emit('show')">Показать</v-btn>
      </v-toolbar-items>
      <v-toolbar-items >
        <v-btn icon @click="$emit('settings')">
          <v-icon>{{settingsMode?'mdi-cog':'mdi-cog-outline'}}</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
  </header>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class LHeader extends Vue {
  @Prop() settingsMode = false;
}
</script>
