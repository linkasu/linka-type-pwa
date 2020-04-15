<template>
  <v-stepper v-model="step">
    <v-stepper-header>
      <v-stepper-step :complete="step > 1" step="1">Приветствие</v-stepper-step>

      <v-divider></v-divider>

      <v-stepper-step :complete="step > 2" step="2">Настройка голоса</v-stepper-step>

      <v-divider></v-divider>

      <v-stepper-step step="3">Информация о себе</v-stepper-step>
    </v-stepper-header>

    <v-stepper-items>
      <v-stepper-content step="1">
        <blockquote class="blockquote">
          <p>Добро пожаловать в коммуникатор LINKa: напиши. Сейчас вам нужно будет пройти первичную настройку. Мы выберем голос, которым вы будете говорить, и заполним анкету о вашей жизни. Это нужно для создания набора базовых фраз, которыми вы быстро и легко сможете говорить с миром.</p>
          <p>Я надеюсь, что этот коммуникатор станет неотъемлемой частью вашей жизни. С помощью него вы сможете общаться с близкимии, находиить новых друзей, выступать с речами на семейных застольях или важеных мероприятиях.</p>

          <footer align="right">
            С любовью Иван Бакаидов,
            <i>основатель LINKa</i>
          </footer>
        </blockquote>
        <v-form ref="form1" v-model="valid[0]" @submit.prevent="next()">
          <v-text-field v-model="name" label="«Меня зовут …»" :rules="nameRules" outlined required></v-text-field>
          <!-- <v-radio-group v-model="gender" :rules="genderRules" required>
            <p>Я говорю о себе, как:</p>
            <v-radio label="Мужчина" value="true"></v-radio>
            <v-radio label="Женщина" value="false"></v-radio>
          </v-radio-group>-->
          <v-btn :color="valid[0]?'success':'error'" type="submit">Дальше</v-btn>
        </v-form>
        <v-spacer />
      </v-stepper-content>

      <v-stepper-content step="2">
        <blockquote class="blockquote">
          <h3>Привет, {{name}}!</h3>
          <p>Сейчас нам нужно настррить синтезатор речи на вашем устройстве. В новых версиях Windows и macOS синтезатор будет работать без интернета. На более старых устройствах это невозможно, поэтому мы будем использовать онлайн озвучку от Яндекс.</p>
        </blockquote>

        <voice-settings />
        <v-form ref="form2" v-model="valid[1]" @submit.prevent="next()">
          <v-layout row wrap>
            <v-flex xs12 md4 lg3>
              <v-card>
                <v-card-title primary-title>Давайте проверим, точно ли вы слышите голос</v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model="checkCode"
                    label="Проверочный код?"
                    type="number"
                    min="1000"
                    max="9999"
                    counter="4"
                    :rules="codeRules"
                    outlined
                  ></v-text-field>
                  <v-btn
                    @click="tts.say(trueCheckCode.toFixed().split('').join(', '))"
                    black
                  >Послушать код</v-btn>
                  <br>
                  <i>Если вы не слышите код, выберете другой голос.</i>
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>

          <v-btn @click="step--">Назад</v-btn>
          <v-btn :color="valid[1]?'success':'error'" type="submit">Дальше</v-btn>
        </v-form>
      </v-stepper-content>
    </v-stepper-items>
    <v-stepper-content step="3">
      <blockquote class="blockquote">
        <h3>Последний шаг, {{name}}!</h3>
        <p>Сейчас надо постараться ответить как можно на большее количество вопросов. Коммуникатор сделает из этого фразы, которыми вы сможете говорить.</p>
        <p>
          <b>Если не хотите отвечать на эти вопросы, смело пропускайте этап и идите дальше.</b>
        </p>
      </blockquote>
      <phrase-maker :name="name" @saved="done" />
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import TTS from "../lib/TTS";

import VoiceSettings from "./components/VoiceSettings.vue";
import PhraseMaker from "./components/PhraseMaker.vue";
import Store from "@/lib/Store";

@Component({
  components: {
    VoiceSettings,
    PhraseMaker
  }
})
export default class Setup extends Vue {
  tts = TTS.instance;
  step: number = 1;
  name: string | null = null;
  gender: boolean | null = null;
  valid: boolean[] = [false, false, false];
  checkCode: number | null = null;
  trueCheckCode = 1000 + Math.floor(Math.random() * 8999);

  next() {
    if ((<any>this.$refs["form" + this.step]).validate()) {
      this.step++;
    }
  }
  done() {
    const store = new Store();
    const root = store.root;
    if (root) {
      root.child("inited").set(true);
    }
    this.$emit("inited");
  }

  nameRules: Array<(v: string) => boolean | string> = [
    v => !!v || "Обязательно введите имя",
    v => (v && v.trim().split(" ").length < 2) || "Введите только имя"
  ];
  genderRules = [
    (v: any) => {
      return v !== null || "Обязательно укажите";
    }
  ];
  codeRules = [
    (v: number) =>
      v == this.trueCheckCode || "Неверный код, послушайте код и введите его"
  ];
}
</script>
