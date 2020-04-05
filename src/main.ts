import Vue from 'vue'

import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'

import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify, {
  theme: {
    themes: {
      light: {
        primary: colors.red.darken1, // #E53935
        secondary: colors.red.lighten4, // #FFCDD2
        accent: colors.indigo.base, // #3F51B5
      },
    },
  }
})

import App from './App.vue'
import './registerServiceWorker'

import VuetifyDialog from 'vuetify-dialog'
import 'vuetify-dialog/dist/vuetify-dialog.css'
 
import 'vue-material-design-icons/styles.css';
import '@mdi/font/css/materialdesignicons.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'


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
