<template>
  <button-row
    :items="!words||words.length===0?'Здесь будут подсказки при вводе'.split(' '):words"
    color="green"
    @buttonclick="(n,i)=>{shortcut(i)}"
  />
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import Component from "vue-class-component";
import ButtonRow from "./ButtonRow.vue";
import { Prop, Watch } from "vue-property-decorator";
const key =
  "pdct.1.1.20171001T082116Z.f25e2b63fec6bfda.539464c0551ea8f6790d15ce6e78977d247d0804";

@Component({
  components: {
    ButtonRow
  }
})
export default class Predicator extends Vue {
  @Prop({
    type: String,
    required: true
  })
  value: String | undefined;
  pos = 0;
  words: string[] = [];
  @Watch("value") onText(value: string) {
    this.clear();
    if (value == "") {
      return;
    }
    let url = `https://predictor.yandex.net/api/v1/predict.json/complete?key=${key}&q=${encodeURIComponent(
      value
      //.slice(0, this.position())
    )}&lang=ru&limit=5`;
    axios
      .get(url)
      .then(res => {
        this.pos = res.data.pos;
        this.words = res.data.text;
      })
      .catch(e => {
        this.clear();
      });
  }
  shortcut(index: number) {
    if (!this.value || !this.words[index]) return;

    const text =
      (this.pos < 0 ? this.value.slice(0, this.pos) : this.value) +
      (this.pos === 1 ? " " : "");
    this.$emit("input", text + this.words[index] + " ");
    this.clear();
  }
  clear() {
    this.words = [];
  }
}
</script>
