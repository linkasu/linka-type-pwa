<template>
  <v-card flat>
    <v-card-text>
      <v-container fluid>
        <section>
          <v-subheader>Блоки программы</v-subheader>
          <v-layout row wrap>
            <v-flex xs12 sm4 md4>
              <v-checkbox label=" Предсказатель слов яндекс" v-model="predicator"></v-checkbox>
            </v-flex>
            <v-flex xs12 sm4 md4>
              <v-checkbox label=" Быстрые фразы" v-model="quickes"></v-checkbox>
            </v-flex>
            <v-flex xs12 sm4 md4>
              <v-checkbox label=" Банк фраз" v-model="bank"></v-checkbox>
            </v-flex>
          </v-layout>
        </section>
        <section>
          <v-subheader>Варианты проговаривания при наборе</v-subheader>
          <v-radio-group v-model="readLastWord">
            <v-layout row wrap>
              <v-flex xs12 sm4 md4>
                <v-radio label="Озвучивать последнее слово" :value="true"></v-radio>
              </v-flex>
              <v-flex xs12 sm4 md4>
                <v-radio label="Озвучивать щелчки клавиш" :value="false"></v-radio>
              </v-flex>
              <v-flex xs12 sm4 md4>
                <v-radio label="Ничего не делать" :value="null"></v-radio>
              </v-flex>
            </v-layout>
          </v-radio-group>
        </section>
        <section>
          <v-subheader>Работа с клавиатурой</v-subheader>
          <v-layout row wrap>
            <v-flex xs12 sm4 md4>
              <v-checkbox label="Залипание клавиши CMD/Ctrl" v-model="holdCMD"></v-checkbox>
            </v-flex>
          </v-layout>
        </section>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import TTS from "../../lib/TTS";
import LocalMemory from "../../lib/LocalMemory";
import { Watch } from "vue-property-decorator";

@Component
export default class AdaptiveSettings extends Vue {
  lc = LocalMemory.instance;
  predicator: boolean | null = this.lc.getBoolean("predicator", true);
  quickes: boolean | null = this.lc.getBoolean("quickes", true);
  bank: boolean | null = this.lc.getBoolean("bank", true);
  readLastWord: boolean | null = this.lc.getBoolean("readLastWord", false);
  holdCMD: boolean | null = this.lc.getBoolean("holdCMD", false);
  @Watch("predicator") onPredicator(value: boolean) {
    this.lc.setBoolean("predicator", value);
  }
  @Watch("quickes") onQuickes(value: boolean) {
    this.lc.setBoolean("quickes", value);
  }
  @Watch("bank") onBank(value: boolean) {
    this.lc.setBoolean("bank", value);
  }
  @Watch("readLastWord") onReadLastWord(value: boolean) {
    this.lc.setBoolean("readLastWord", value);
  }
  @Watch("holdCMD") onHoldCMD(value: boolean) {
    this.lc.setBoolean("holdCMD", value);
  }
  created() {}
}
</script>