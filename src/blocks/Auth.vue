  <template>
  <v-content>
    <v-container fluid fill-height>
      <v-layout align-center justify-center>
        <v-flex xs12 sm8 md4>
          <v-card class="elevation-12">
            <v-toolbar dark color="primary">
              <v-toolbar-title v-if="isRegistrationMode">Регистрация в LINKa</v-toolbar-title>
              <v-toolbar-title v-else>Войти в LINKa</v-toolbar-title>
            </v-toolbar>
            <v-card-text v-if="!isRegistrationMode ">
              <p>Пожалуйста, введите свой логин и пароль. Если у вас не было аккаунта нажмите кнопку Зарегистрироваться</p>
              <p>Регистрация необходима для персонализации коммуникатора.</p>
              </v-card-text>
              <v-card-text>
              <v-form v-model="valid" ref="form">
                <v-text-field
                  prepend-icon="person"
                  label="Email"
                  type="email"
                  ref="email"
                  :rules="[emailCheck]"
                  v-model="email"
                  required
                  @keydown.enter="($refs.password )?.focus()"
                ></v-text-field>
                <v-text-field
                  ref="password"
                  prepend-icon="lock"
                  name="password"
                  label="Пароль"
                  id="password"
                  type="password"
                  v-model="password"
                  required
                  :rules="[passwordCheck]"
                  @keydown.enter="()=>isRegistrationMode?register(): login()"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-text v-if="error" class="error">{{error}}</v-card-text>
            <v-card-actions>
              <v-btn @click="isRegistrationMode = !isRegistrationMode" xs4>{{isRegistrationMode?'Уже есть аккаунт': 'Зарегистрироваться'}}</v-btn>

              <v-spacer></v-spacer>
              <v-btn @click="login" v-if="!isRegistrationMode">Войти</v-btn>
              <v-btn @click="register" v-else>Зарегистрироваться</v-btn>
            </v-card-actions>
            <v-card-actions v-if="!isRegistrationMode">
              <v-btn @click="resetPassword">Сброс пароля</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

  <script lang="ts">
import Vue from "vue";
import fireapp from "../lib/fireapp";
import Component from "vue-class-component";

@Component
export default class Auth extends Vue {
  email: string = "";
  password: string = "";
  error: string | null = null;
  isRegistrationMode = false
  valid = false;
  async login() {
    this.error = null;
    if (!(<any>this.$refs.form).validate()) return;
    try {
      const res = await fireapp
        .auth()
        .signInWithEmailAndPassword(
          this.email.trim().toLowerCase(),
          this.password.trim()
        );

      this.$emit("login", res.user);
    } catch (e) {
      this.error = (e as Error).message;
      this.password = "";
    }
  }
   async register() {
    this.error = null;
    if (!(<any>this.$refs.form).validate()) return;

    try {
      await fireapp
        .auth()
        .createUserWithEmailAndPassword(
          this.email.trim().toLowerCase(),
          this.password
        );
      this.login();
    } catch (error) {
      this.error = (error as Error).message;
    }
  }

   async resetPassword() {
    if (!(<any>this.$refs.email).validate()) return;

    if (
      !(await this.$dialog.confirm({
        title: "Сброс пароля",
        text: "Вы уверены, что хотите сбросить пароль для " + this.email,
        actions: ["Да", "Нет"]
      }))
    )
      return;
    try {
      await fireapp.auth().sendPasswordResetEmail(this.email);
    } catch (error) {
      return this.$dialog.error({
        title: "Ошибка",
        text: (error as Error).message
      });
    }
    return this.$dialog.warning({
      title: "Сброс пароля",
      text: "Вы уверены, что хотите сбросить пароль для " + this.email
    });
  }

  public passwordCheck(value: string) {
    return value.length < 8 ? "Пароль должен быть больше 7 символов." : true;
  }

  public emailCheck(value: string) {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || "Неверный емейл.";
  }
}
</script>

  <style scoped>
.error {
  color: #f00;
}
</style>
