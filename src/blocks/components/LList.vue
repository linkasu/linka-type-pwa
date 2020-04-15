<template>
  <v-card height="100%">
    <v-card-title primary-title>
        <v-btn @click="$emit('back')" icon v-if="tstatement" title="Вернуться к категориям">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-btn @click="choose('delete')" icon title="Удалить">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-btn @click="choose('edit')" icon title="Редактировать">
          <v-icon>mdi-pencil-outline</v-icon>
        </v-btn>
        <v-btn
          @click="$emit('isPaste', !isPaste) "
          icon
          v-if="tstatement"
          :color="isPaste?'accent':''"
          title="При нажатии вставлять в пооле ввода"
        >
          <v-icon>mdi-content-paste</v-icon>
        </v-btn>
        <v-btn @click="$emit('random')" v-if="tstatement" icon title="Выбрать случайную фразу">
          <v-icon>mdi-flash</v-icon>
        </v-btn>
        <v-btn
          v-if="tstatement"
          @click="isEditor=true"
          icon
          title="Редактировать категорию целиком"
        >
          <v-icon>mdi-format-text</v-icon>
        </v-btn>
        <v-btn v-if="tstatement" @click="isReader=true" icon title="Режим выступлления">
          <v-icon>mdi-book-open</v-icon>
        </v-btn>
        <v-spacer />
        <h3>{{title}}</h3>

    </v-card-title>
    <v-card-text>

      <overlay :active="caller!==null" @quit="()=>caller=null">
        <v-layout wrap width="100%">
          <v-flex xs6 :md="items.length>10?6:4" v-for="(item, index) of items" :key="item.id">
            <badge-button :value="item[dkey]" :hint="index|hintFilter" @buttonclick="select(item)" />
          </v-flex>
        </v-layout>
      </overlay>
    </v-card-text>
    <text-category-editor
      v-if="isEditor"
      :items="items"
      @save="$emit('save', $event)"
      @quit="isEditor=false"
    />
    <reader v-if="isReader" :items="items" @quit="isReader=false" />
    <v-btn v-if="caller==null" absolute dark bottom right color="accent" @click="$emit('add')">+</v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { QWERTY } from "./../../constants";
import Overlay from "./Overlay.vue";
import BadgeButton from "./BadgeButton.vue";
import TextCategoryEditor from "./TextCategoryEditor.vue";
import Reader from "./Reader.vue";
import { Prop } from "vue-property-decorator";

@Component({
  components: { Overlay, BadgeButton, Reader, TextCategoryEditor },
  filters: {
    hintFilter(i: number) {
      if (i > 8 && QWERTY[i - 9]) {
        return QWERTY[i - 9].toUpperCase();
      }
      return i + 1;
    }
  }
})
export default class LList extends Vue {
  caller: Function | null = null;
  isEditor = false;
  isReader = false;
  @Prop() items: Array<any> | undefined;
  @Prop() dkey: String | undefined;
  @Prop() title: String | undefined;
  @Prop() isPaste: boolean | undefined;
  @Prop() type: "category" | "statement" | undefined;

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
.v-toolbar-for-over {
  transform: none !important;
  height: auto !important;
  min-height: 56px ;
}

.v-toolbar-for-over>.v-toolbar__content{
  height: auto !important;
  min-height: 56px ;
}
</style>
