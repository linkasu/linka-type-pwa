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
      <ul v-if="items.length>0">
        <li v-for="item in sortedItems" :key="item.id">
          <v-btn block @click="select(item)">{{item[dkey]}}</v-btn>
        </li>
      </ul>
      <v-row v-else>
        <v-col>
          <h3 absolute center>Ничего не найдено, создайте</h3>
        </v-col>
      </v-row>
    </overlay>

    <v-btn v-if="caller==null" absolute dark bottom right color="pink" @click="$emit('add')">+</v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Overlay from "./Overlay.vue";
import { Prop } from "vue-property-decorator";

@Component({
  components: { Overlay },
  props: {
    items: Array,
    dkey: String,
    title: String
  }
})
export default class LList extends Vue {
  caller: Function | null = null;

  @Prop() items: Array<any> = [];
  @Prop() dkey: String = "";
  @Prop() title: String = "";
  @Prop() type: "category" | "statement" = "category";

  get sortedItems() {
    return this.items.sort((a: any, b: any) => {
      if (a.default !== b.default) {
        return a.default ? -1 : 1;
      }
      return a.created - b.created;
    });
  }

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
