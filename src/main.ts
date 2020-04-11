import Vue from 'vue'

import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'

import colors from 'vuetify/lib/util/colors'



Vue.use(Vuetify)

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
   vuetify: new Vuetify( {
    theme: {
      themes: {
        light: {
          primary: "#197377", // #E53935
          secondary: "#bed64f", // #FFCDD2
          accent: "#fbcc30", // #3F51B5
        },
      },
    },
  }),
  components:{
    Overlay
  },
  render: h => h(App),
}).$mount('#app')
