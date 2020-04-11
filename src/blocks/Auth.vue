  <template>
  <v-content>
    <v-container fluid fill-height>
      <v-layout align-center justify-center>
        <v-flex xs12 sm8 md4>
          <v-card class="elevation-12">
            <v-toolbar dark color="primary">
              <v-toolbar-title>Войти в LINKa</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-form>
                <v-text-field
                  prepend-icon="person"
                  label="Email"
                  type="text"
                  v-model="email"
                  @keydown.enter="$refs.password.focus()"
                ></v-text-field>
                <v-text-field
                  ref="password"
                  prepend-icon="lock"
                  name="password"
                  label="Пароль"
                  id="password"
                  type="password"
                  v-model="password"
                  @keydown.enter="login"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-text v-if="error" class="error">{{error}}</v-card-text>
            <v-card-actions>
              <v-btn @click="register" xs4>Зарегистрироваться</v-btn>

              <v-spacer></v-spacer>
              <v-btn @click="login">Войти</v-btn>
            </v-card-actions>
            <v-card-actions>
              <v-btn @click="resetPassword" >Сброс пароля</v-btn>
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
  private async login() {
    this.error = null;
    try {
      const res = await fireapp
        .auth()
        .signInWithEmailAndPassword(this.email.trim(), this.password.trim());

      this.$emit("login", res.user);
    } catch (e) {
      this.error = e.message;
      this.password = "";
    }
  }
  private async register() {
    this.error = null;
    try {
      await fireapp
        .auth()
        .createUserWithEmailAndPassword(this.email, this.password);
      this.login();
    } catch (error) {
      this.error = error.message;

    }
  }

  private async resetPassword() {
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
        text: error.message
      });
    }
    return this.$dialog.warning({
      title: "Сброс пароля",
      text: "Вы уверены, что хотите сбросить пароль для " + this.email
    });
  }
}
</script>

  <style scoped>
.error {
  color: #f00;
}
</style>
