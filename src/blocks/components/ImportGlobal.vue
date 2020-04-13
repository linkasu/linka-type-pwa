<template>
  <section>
    <v-card flat>
      <v-card-text>
        <v-container fluid>
          <v-expansion-panels>
            <v-expansion-panel v-for="(item, index) of categories" :key="item.id">
              <v-expansion-panel-header>{{item.label}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-card>
                  <v-card-text>
                    <ul>
                      <li
                        v-for="statement of item.statements"
                        :key="statement.id"
                      >{{statement.text}}</li>
                    </ul>
                  </v-card-text>
                </v-card>
                <v-card-actions color="primary lighten-1" padless>
                  <v-row justify="center" no-gutters>
                    <v-btn
                      :disabled="dones[index]"
                      @click="select(index,item.id)"
                    >{{dones[index]?'Загружено':'Импортировать'}}</v-btn>
                  </v-row>
                </v-card-actions>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-container>
      </v-card-text>
    </v-card>

    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Store from "@/lib/Store";
import { Category } from "../../lib/Category";
import fireapp from "../../lib/fireapp";

@Component
export default class ImportGlobal extends Vue {
  store = new Store();
  categories: Category[] = [];
  loading = true;

  get dones(): boolean[] {
    return this.categories.map(() => false);
  }

  async select(index: number, id: string, force = false) {
    this.loading = true;
    const res = await fireapp.functions().httpsCallable("importFromGlobal")({
      id,
      force
    });

    if (res.data === "exists") {
      const answer = await this.$dialog.confirm({
        title: "Перезаписать?",
        text: "Категория уже была загружена, хотите перезаписать?",
        actions:{
          false:"нет",
          true:"да"
        }
      });
      if (answer) {
        
        await this.select(index, id, true);
      }
    }

    this.loading = false;
    this.dones[index] = true;
  }

  created() {
    this.store.global
      .child("Category")
      .once("value")
      .then(snap => {
        const categories: Category[] = Store.sortItems(
          Object.values<Category>(snap.val())
        );

        this.categories = categories;
        this.loading = false;
      });
  }
}
</script>