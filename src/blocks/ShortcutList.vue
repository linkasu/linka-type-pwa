<template>
  <v-overlay>
    
    <v-simple-table>
        <thead>
          <tr>
            <th class="text-left">Сочетание</th>
            <th class="text-left">Блок</th>
            <th class="text-left">Функция</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) of shortcuts" :key="i">
            <td>
              <span v-if="item.mod">ctrl+</span>
              {{ item.key }}
            </td>
            <td>{{ item.block }}</td>
            <td>{{ item.func }}</td>
          </tr>
        </tbody>
    </v-simple-table>

    <v-btn fab  right small color="primary" @click="$emit('close')">
      <v-icon dark>mdi-close</v-icon>
    </v-btn>
  </v-overlay>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class ShortcutLixt extends Vue {
  shortcuts: Shortcut[] = [
    {
      key: "i",
      mod: false,
      func: "Сфокусироваться на поле ввода",
      block: "Везде"
    },
    {
      key: "1...5",
      mod: true,
      func: "Выбрать подсказку из предикатора",
      block: "Поле ввода"
    },
    {
      key: "Backspace",
      mod: true,
      func: "Очистить поле ввода",
      block: "Поле ввода"
    },
    {
      key: "↑",
      mod: true,
      func: "Переключиться на предыдущий чат",
      block: "Поле ввода"
    },
    {
      key: "↓",
      mod: true,
      func: "Переключиться на следующий чат",
      block: "Поле ввода"
    },
    {
      key: "0",
      mod: true,
      func: "Сфокусироваться на быстрых фразах",
      block: "Везде"
    },
    {
      key: "1...6",
      mod: false,
      func: "Выбрать быструю фразу",
      block: "Быстрые фразы"
    },
    {
      key: "Ж",
      mod: true,
      func: "Сфокусироваться на банке фраз",
      block: "Везде"
    },

    {
      key: "1...9",
      mod: false,
      func: "Выбрать категорию/фразу",
      block: "Банк фраз"
    },
    {
      key: "V",
      mod: false,
      func: "Включить режим вставки",
      block: "Банк фраз"
    },
    {
      key: "R",
      mod: false,
      func: "Выбрать случайную фразу",
      block: "Банк фраз"
    }
  ];
}

interface Shortcut {
  key: string;
  mod: boolean;
  block: "Везде" | "Поле ввода" | "Быстрые фразы" | "Банк фраз";
  func: string;
}
</script>