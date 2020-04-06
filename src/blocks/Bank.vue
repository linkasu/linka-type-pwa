<template>
  <section tabindex="0" class="group" @keydown="onInput" @keydown.esc="cid=null">
    <v-layout>
      <v-flex xs12 v-if="cid===null">
        <l-list
          @select="cselect"
          @delete="(item)=>deleteItem('category', item)"
          @edit="(item)=>editItem('category', item)"
          @add="cadd"
          type="categoy"
          :items="categories"
          dkey="label"
          title="Категории"
        />
      </v-flex>
      <v-flex xs12 v-else>
        <l-list
          @select="sselect"
          @delete="(item)=>deleteItem('statement', item)"
          @edit="(item)=>editItem('statement', item)"
          @add="sadd"
          @back="cid=null"
          type="statement"
          :items="statements"
          dkey="text"
          :title="title||'Категория не выбрана'"
        />
      </v-flex>
    </v-layout>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import fireapp from "../lib/fireapp";
import Store from "../lib/Store";
import LList from "./components/LList.vue";
import TTS from "../lib/TTS";
import { QWERTY } from "../constants";

@Component({
  components: {
    LList
  }
})
export default class Bank extends Vue {
  store: Store = new Store();
  categories: Array<any> = [];
  statements: Array<any> = [];
  cid: string | null = null;
  title: string | null = null;
  user: fireapp.User | null = fireapp.auth().currentUser;

  onInput(e: KeyboardEvent) {
    let number;
    if (e.which > 48 && e.which < 58) {
      number = e.which - 48;
    } else if (e.which > 64 && e.which < 91) {
      number = QWERTY.indexOf(e.code[3].toLowerCase()) + 10;
    } else return;
    number--;
    

    if (!this.cid) {
      const item = this.categories[number]
      if(!item) return;
      this.cselect(item)
    } else {
      const item = this.statements[number]
      if(!item) return;
      this.sselect(item)
    }
  }

  cselect(category: any) {
    if (!category.statements) {
      category.statements = {};
    }
    this.cid = category.id;
    this.title = category.label;
    if (!this.user || !this.store.root) return;
    this.statements = [];
    const ref = this.store.root.child("/Category/" + this.cid + "/statements");
    ref.off();
    ref.on("child_added", this.loadStatement);
    ref.on("child_changed", this.loadStatement);
    ref.on("child_removed", this.removeStatement);
  }

  sselect(statement: any) {
    TTS.instance.say(statement.text);
  }

  prompt(title: string, edit?: string): Promise<string> {
    return this.$dialog
      .prompt({
        text: "Завтрак",
        value: edit,
        title,
        actions: ["Отменить", edit ? "Создать" : "Сохранить"]
      })
      .then(text => {
        if (text == undefined || text == "") {
          return this.$dialog.error({
            text: "Вы ничего не ввели",
            title: "Ошибка"
          });
        }
        return text;
      });
  }
  async cadd() {
    let title = await this.prompt("Введите название категории");

    if (!this.store.root || !title) return;
    const id = generateId();

    this.store.root
      .child("Category")
      .child(id)
      .set({
        created: +new Date(),
        label: title,
        id,
        statements: {}
      });
  }
  async sadd() {
    let text = await this.prompt("Введите высказывание");

    if (!this.store.root || !text || !this.cid) return;
    const id = generateId();
    await this.store.root
      .child("Category")
      .child(this.cid)
      .child("statements")
      .child(id)
      .set({
        created: +new Date(),
        categoryId: this.cid,
        text,
        id
      });
  }

  async deleteItem(what: string, item: any) {
    if (!this.store.root) return;
    if (what === "category") {
      await this.store.root
        .child("Category")
        .child(item.id)
        .remove();
    } else if (what === "statement") {
      await this.store.root
        .child("Category")
        .child(item.categoryId)
        .child("statements")
        .child(item.id)
        .remove();
    }
  }
  async editItem(what: string, item: any) {
    const newText = await this.prompt("Редактировать", item.label || item.text);
    if (!this.store.root || !newText) return;

    if (what === "category") {
      await this.store.root
        .child("Category")
        .child(item.id)
        .child("label")
        .set(newText);
    } else if (what === "statement") {
      await this.store.root
        .child("Category")
        .child(item.categoryId)
        .child("statements")
        .child(item.id)
        .child("text")
        .set(newText);
    }
  }

  loadCategory(data: fireapp.database.DataSnapshot) {
    if (this.categories.some(item => item.id === data.key)) return;
    const category = data.val();

    this.categories.push(category);
    this.categories = this.sortedItems(this.categories);
  }
  loadStatement(data: fireapp.database.DataSnapshot) {
    this.removeStatement(data);
    this.statements.push(data.val());
    this.statements = this.sortedItems(this.statements);
  }

  removeStatement(data: fireapp.database.DataSnapshot) {
    this.statements = this.statements.filter(item => item.id != data.key);
    this.statements = this.sortedItems(this.statements);
  }
  removeCategory(data: fireapp.database.DataSnapshot) {
    this.categories = this.categories.filter(item => item.id != data.key);
    this.categories = this.sortedItems(this.categories);

  }
  created() {
    if (this.user == null) return;
    if (!this.store.root) return;

    const ref = this.store.root.child("Category");
    ref.off();
    ref.on("child_changed", this.loadCategory);
    ref.on("child_added", this.loadCategory);
    ref.on("child_removed", this.removeCategory);

    window.addEventListener("keydown", this.onWindowInput)
  }





  onWindowInput(e:KeyboardEvent){
    if(e.metaKey&&e.which===186){
      (<HTMLElement> this.$el).focus()
      return false
    }
  }
  sortedItems(items: any[]) {
    return items.sort((a: any, b: any) => {
      if (a.default !== b.default) {
        return a.default ? -1 : 1;
      }
      return a.created - b.created;
    });
  }
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";
const SIZE = 16;

function generateId(): string {
  let res = "";
  for (let index = 0; index < SIZE; index++) {
    res += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return res;
}
</script>

<style scoped>
ul {
  list-style: none;
}
</style>
