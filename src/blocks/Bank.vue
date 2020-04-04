<template>
  <section>
    <v-layout>
      <v-flex xs12 md6 lg4>
        <l-list
          @select="cselect"
          @delete="(item)=>deleteItem('category', item)"
          @edit="(item)=>editItem('category', item)"
          @add="cadd"
          :items="categories"
          dkey="label"
          title="Категории"
        />
      </v-flex>
      <v-flex xs12 md6 lg8>
        <l-list
          @select="sselect"
          @delete="(item)=>deleteItem('statement', item)"
          @edit="(item)=>editItem('statement', item)"
          @add="sadd"
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
  }
  loadStatement(data: fireapp.database.DataSnapshot) {
    this.removeStatement(data);
    this.statements.push(data.val());
  }

  removeStatement(data: fireapp.database.DataSnapshot) {
    this.statements = this.statements.filter(item => item.id != data.key);
  }
  removeCategory(data: fireapp.database.DataSnapshot) {
    this.categories = this.categories.filter(item => item.id != data.key);
  }
  created() {
    if (this.user == null) return;
    if (!this.store.root) return;

    const ref = this.store.root.child("Category");
    ref.off();
    ref.on("child_changed", this.loadCategory);
    ref.on("child_added", this.loadCategory);
    ref.on("child_removed", this.removeCategory);
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
