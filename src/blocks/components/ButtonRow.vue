<template>
  <v-layout>
    <v-flex xs6 md2 v-for="(n, i) of items" :key="i">
      <badge-button :hint="i+1" :focus="focus" :value="n" :color="color" @buttonclick="$emit('buttonclick', n, i)"/>
    </v-flex>
  </v-layout>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BadgeButton from "./BadgeButton.vue";
@Component({
  props: {
    items: {
      type: Array,
      default: []
    },
    focus: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: "secondary"
    }
  },
  components: {
    BadgeButton
  }
})
export default class ButtonRow extends Vue {}
</script>
<style  scoped>
.layout {
  flex-wrap: wrap;
}
</style>