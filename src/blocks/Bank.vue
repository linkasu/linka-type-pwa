<template>
  <section
    tabindex="0"
    class="group"
    @keydown="onInput"
    @keydown.esc.self="back"
    @keydown.82.self="srandom"
    @keydown.86.self="isPaste=!isPaste"
  >
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
          @back="back()"
          @save="refillCategory"
          @isPaste="isPaste=!isPaste"
          type="statement"
          :items="statements"
          dkey="text"
          :isPaste="isPaste"
          @random="srandom"
          :title="title||'Категория не выбрана'"
        />
      </v-flex>

      <v-overlay :value="loading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </v-layout>

    <v-switch v-if="isAdmin&&hasHash" color="white" x-small label="globalEdit" v-model="globalEdit"></v-switch>
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
import { StoreItem } from "../lib/StoreItem";
import { Statement } from "../lib/Statement";
import { Category } from "../lib/Category";
import { analytics } from "firebase";
import { Watch } from "vue-property-decorator";

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
  user: firebase.User | null = fireapp.auth().currentUser;
  isPaste = false;
  loading = true;
  isAdmin = false;
  globalEdit = false;

  public get hasHash(): boolean {
    return window.location.hash === "#admin";
  }

  @Watch("globalEdit") onGlobalEdit(value: boolean) {
    this.categories = [];
    this.statements = [];

    this.refCategory();
  }
  onInput(e: KeyboardEvent) {
    if (<HTMLElement>e.target != this.$el) return true;

    let number;
    if (e.which > 48 && e.which < 58) {
      number = e.which - 48;
    } else if (e.which > 64 && e.which < 91) {
      number = QWERTY.indexOf(e.code[3].toLowerCase()) + 10;
    } else return;
    number--;

    if (!this.cid) {
      const item = this.categories[number];
      if (!item) return;
      analytics().logEvent("bank_key_cselect");
      this.cselect(item);
    } else {
      const item = this.statements[number];
      if (!item) return;
      analytics().logEvent("bank_key_sselect");
      this.sselect(item);
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
    const ref = this.store.getStatements(
      this.cid!,
      this.isAdmin && this.globalEdit
    );
    ref.off();
    ref.on("child_added", this.loadStatement);
    ref.on("child_changed", this.loadStatement);
    ref.on("child_removed", this.removeStatement);
    analytics().logEvent("bank_cselect");
  }

  sselect(statement: Statement) {
    if (this.isPaste) {
      this.$emit("paste", statement.text);
      this.isPaste = false;
      return;
    }
    TTS.instance.say(statement.text);
    analytics().logEvent("bank_key_sselect");
  }
  srandom() {
    if (!this.cid) return;
    this.sselect(
      this.statements[Math.floor(Math.random() * (this.statements.length - 1))]
    );

    analytics().logEvent("bank_random");
  }
  back() {
    this.isPaste = false;
    this.cid = null;
  }
  prompt(title: string, edit?: string): Promise<string> {
    return this.$dialog
      .prompt({
        text: "Введите название",
        value: edit,
        title,
        actions: ["Отменить", edit ? "Создать" : "Сохранить"]
      })
      .then(text => {
        if (text == undefined || text == "") {
          return this.$dialog
            .error({
              text: "Вы ничего не ввели",
              title: "Ошибка",
              actions: {
                false: "Закрыть"
              }
            })
            .then(() => false);
        }
        return text;
      });
  }
  async cadd() {
    let title = await this.prompt("Введите название категории");

    if (!this.store.root || !title) return;
    this.store.createCategory(title, this.isAdmin && this.globalEdit);
    analytics().logEvent("bank_cadd");
  }
  async sadd() {
    let text = await this.prompt("Введите высказывание");

    if (!this.store.root || !text || !this.cid) return;
    await this.store.createStatement(
      this.cid,
      text,
      this.isAdmin && this.globalEdit
    );
    analytics().logEvent("bank_sadd");
  }

  async deleteItem(what: "category" | "statement", item: StoreItem) {
    if(await this.$dialog.confirm({
      title:'Действительно удалитть?',
      text:'Вы действительно хотите удалить?',
      actions:{
        true:'Да',
        false:'Нет'
      }
    }))
    await this.store.deleteItem(
      what,
      this.cid,
      item.id,
      this.isAdmin && this.globalEdit
    );
    analytics().logEvent("bank_delete_" + what);
  }
  async editItem(what: "category" | "statement", item: Statement | Category) {
    const newText = await this.prompt(
      "Редактировать",
      (<Category>item).label || (<Statement>item).text
    );
    if (!newText) return;

    if (what === "category") {
      this.store.editCategory(
        <Category>item,
        newText,
        this.isAdmin && this.globalEdit
      );
    } else {
      this.store.editStatement(
        <Statement>item,
        newText,
        this.isAdmin && this.globalEdit
      );
    }
    analytics().logEvent("bank_edit_" + what);
  }
  async refillCategory(rows: string) {
    if (!this.cid || !this.store.root) return;
    await this.store
      .getStatements(this.cid, this.isAdmin && this.globalEdit)
      .remove();
    this.loading = true;
    for (const row of rows) {
      await this.store.createStatement(
        this.cid,
        row,
        this.isAdmin && this.globalEdit
      );
    }
    this.loading = false;
    analytics().logEvent("bank_refill");
  }
  loadCategory(data: firebase.database.DataSnapshot) {
    this.loading = false;

    if (this.categories.some(item => item.id === data.key)) return;
    const category = data.val();

    this.categories.push(category);
    this.categories = this.sortedItems(this.categories);
  }
  loadStatement(data: firebase.database.DataSnapshot) {
    this.removeStatement(data);
    this.statements.push(data.val());
    this.statements = this.sortedItems(this.statements);
  }

  removeStatement(data: firebase.database.DataSnapshot) {
    this.statements = this.statements.filter(item => item.id != data.key);
    this.statements = this.sortedItems(this.statements);
  }
  removeCategory(data: firebase.database.DataSnapshot) {
    this.categories = this.categories.filter(item => item.id != data.key);
    this.categories = this.sortedItems(this.categories);
  }
  created() {
    if (this.user == null) return;
    if (!this.store.root) return;
    this.store.isAdmin().then(is => {
      this.isAdmin = is;
      this.refCategory();
    });
    window.addEventListener("keydown", this.onWindowInput);
  }
  refCategory() {
    const ref = this.store
      .host(this.isAdmin && this.globalEdit)
      .child("Category");
    ref.off();
    ref.on("child_changed", this.loadCategory);
    ref.on("child_added", this.loadCategory);
    ref.on("child_removed", this.removeCategory);
  }

  onWindowInput(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.which === 186) {
      (<HTMLElement>this.$el).focus();
      e.preventDefault();
      return false;
    }
  }
  sortedItems(items: any[]) {
    return Store.sortItems(items);
  }
}
</script>

<style scoped>
ul {
  list-style: none;
}
</style>
