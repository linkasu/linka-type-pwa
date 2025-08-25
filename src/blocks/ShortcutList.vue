<template>
  <v-dialog v-model="value" max-width="600">
    <v-card>
      <v-card-title class="headline">Горячие клавиши</v-card-title>
      <v-card-text>
        <v-simple-table>
          <thead>
            <tr>
              <th class="text-left">Сочетание</th>
              <th class="text-left">Описание</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in shortcuts" :key="i">
              <td>{{ item.key }}</td>
              <td>{{ item.desc }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('input', false)">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class ShortcutList extends Vue {
  @Prop({ default: false }) value!: boolean;

  shortcuts: Shortcut[] = [
    { key: "Ctrl + I", desc: "Сфокусироваться на поле ввода" },
    { key: "Ctrl + 1...5", desc: "Выбрать подсказку из предикатора" },
    { key: "Ctrl + Backspace", desc: "Очистить поле ввода" },
    { key: "Ctrl + ↑", desc: "Переключиться на предыдущий чат" },
    { key: "Ctrl + ↓", desc: "Переключиться на следующий чат" },
    { key: "Ctrl + 0", desc: "Сфокусироваться на быстрых фразах" },
    { key: "1...6", desc: "Выбрать быструю фразу" },
    { key: "Ctrl + Ж", desc: "Сфокусироваться на банке фраз" },
    { key: "1...9", desc: "Выбрать категорию/фразу в банке" },
    { key: "V", desc: "Включить режим вставки" },
    { key: "R", desc: "Выбрать случайную фразу" }
  ];
}

interface Shortcut {
  key: string;
  desc: string;
}
</script>

