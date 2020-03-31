import Vue from 'vue'

import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'

Vue.use(Vuetify, {
})

import App from './App.vue'
import './registerServiceWorker'

import VuetifyDialog from 'vuetify-dialog'
import 'vuetify-dialog/dist/vuetify-dialog.css'
 
import 'vue-material-design-icons/styles.css';
import Overlay from './blocks/components/Overlay.vue'
import TTS from './lib/TTS'


Vue.use(VuetifyDialog, {
  context: {
    Vuetify
  }
})

Vue.config.productionTip = false
Vue.prototype.$tts = TTS.instance;


new Vue({
  //  vuetify: new Vuetify(),
  components:{
    Overlay
  },
  render: h => h(App),
}).$mount('#app')
