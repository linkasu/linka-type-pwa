<template>
  <v-app id="app" v-if="auth!==null" light>
    <v-overlay :value="loading">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <auth v-if="!auth" @login="login" />
    <div v-else>
      <setup v-if="inited===false" />
      <main-ui v-if="inited===true" />
    </div>
  </v-app>
</template>

<script lang="ts">
import fireapp from "./lib/fireapp";
import { Component, Vue, Emit } from "vue-property-decorator";
import Auth from "./blocks/Auth.vue";
import MainUI from "./blocks/MainUI.vue";
import Setup from "./blocks/Setup.vue";
import Store from "./lib/Store";
import ee from "./registerServiceWorker";

@Component({
  components: {
    Auth,
    MainUi: MainUI,
    Setup
  }
})
export default class App extends Vue {
  auth: boolean | null = null;
  inited: boolean | null = null;
  loading = true;
  login(user: firebase.User) {
    this.auth = true;
  }
  async created() {
    await fireapp.auth().setPersistence(fireapp.auth.Auth.Persistence.LOCAL);
    fireapp.auth().onAuthStateChanged(state => {
      this.auth = !!state;
      this.loading = false;
      if (this.auth) {
        const store = new Store();
        const root = store.root;
        if (root) {
          root.child("inited").on("value", snap => {
            this.inited = snap.val() === true;

            // this.inited=false
          });
        }
      }
    });

    ee.on("updated", async () => {
      if (
        await this.$dialog.confirm({
          text: "Перезагрузить сейчас?",
          title: "Есть обновление.",
          actions: ["Отменить", "Обновить"]
        })
      ) {
        window.location.reload();
      }
    });
  }
}
</script>
<style>
.group:focus {
  outline-width: 10px;
  /* color: ; */
}
body {
  overscroll-behavior-y: contain;
}
</style>