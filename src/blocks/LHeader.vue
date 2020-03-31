<template>
  <header>
    <v-toolbar>
      <v-toolbar-title>LINKa. Напиши</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn flat @click="$emit('show')">Показать</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    </header>
    
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';

@Component
export default class LHeader extends Vue {}
</script>
