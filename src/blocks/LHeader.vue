<template>
  <header>
    <v-toolbar>
      <v-toolbar-title>{{settingsMode?'Настройки':'LINKa. Напиши'}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items v-if="!settingsMode">
        <!-- <v-btn flat @click="$emit('show')" icon title="Показать">
          <v-icon>mdi-stream</v-icon>
        </v-btn> -->

        <v-btn flat @click="$emit('chat', chat===2?0:chat+1)" icon title="Переключить ячейку памяти">
          <v-icon >mdi-numeric-{{chat+1}}-box-multiple</v-icon>
        </v-btn>
        <v-btn flat @click="$emit('show')" icon title="Показать">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
      </v-toolbar-items>
      <v-toolbar-items>
        <v-btn icon @click="$emit('settings')" title="Настройки">
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
  @Prop() settingsMode:boolean|undefined;
  @Prop({default:0}) chat:number|undefined;
}
</script>
