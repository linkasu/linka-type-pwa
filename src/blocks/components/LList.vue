<template>
  <v-card height="100%">
    <v-toolbar short flat v-if="title">
      <v-btn @click="$emit('back')" icon v-if="tstatement">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn @click="choose('delete')" icon>
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      <v-btn @click="choose('edit')" icon>
        <v-icon>mdi-pencil-outline</v-icon>
      </v-btn>
      <v-btn icon v-if="tstatement">
        <v-icon @click="()=>{}">mdi-content-paste</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon @click="()=>{}">mdi-playlist-music</v-icon>
      </v-btn>
      <v-spacer />
      <v-toolbar-title>{{title}}</v-toolbar-title>
    </v-toolbar>
    <overlay :active="caller!==null" @quit="()=>caller=null">
      <v-layout wrap width="100%">
        <v-flex xs6 :md="items.length>10?6:4" v-for="(item, index) of items" :key="item.id">
          <badge-button :value="item[dkey]" :hint="index|hintFilter" @buttonclick="select(item)" />
        </v-flex>
      </v-layout>
    </overlay>

    <v-btn v-if="caller==null" absolute dark bottom right color="pink" @click="$emit('add')">+</v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { QWERTY } from "./../../constants";
import Overlay from "./Overlay.vue";
import BadgeButton from "./BadgeButton.vue";
import { Prop } from "vue-property-decorator";

@Component({
  components: { Overlay, BadgeButton },
  filters: {
    hintFilter(i: number) {
      if (i > 8) {
        return QWERTY[i - 9].toUpperCase();
      }
      return i + 1;
    }
  }
})
export default class LList extends Vue {
  caller: Function | null = null;

  @Prop() items: Array<any> = [];
  @Prop() dkey: String = "";
  @Prop() title: String = "";
  @Prop() type: "category" | "statement" = "category";


  get tstatement(): boolean {
    return this.type === "statement";
  }

  select(item: any) {
    if (this.caller !== null) {
      this.caller(item);
      this.caller = null;
      return;
    }
    this.$emit("select", item);
  }
  choose(event: string) {
    if (!!this.caller) return;
    this.caller = function(item: any) {
      this.$emit(event, item);
    };
  }
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 1em;
  margin: 0;
}
</style>
