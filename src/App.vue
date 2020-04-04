<template>
  <v-app id="app" v-if="auth!==null">
    <auth v-if="!auth" @login="login" />
    <div v-else>
      <setup v-if="inited===false" />
      <main-ui v-if="inited===true" />
    </div>
  </v-app>
</template>

<script lang="ts">
import fireapp from "./lib/fireapp";
import { Component, Vue } from "vue-property-decorator";
import Auth from "./blocks/Auth.vue";
import MainUI from "./blocks/MainUI.vue";
import Setup from "./blocks/Setup.vue";
import Store from "./lib/Store";

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
  login(user: fireapp.User) {
    this.auth = true;
  }

  async created() {
    await fireapp.auth().setPersistence(fireapp.auth.Auth.Persistence.LOCAL);
    fireapp.auth().onAuthStateChanged(state => {
      this.auth = !!state;
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
  }
}
</script>
<style>
.v-btn__content{
  overflow: hidden;
  display: block;
}

</style>