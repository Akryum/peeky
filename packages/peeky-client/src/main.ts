import './style/vars.css'
import './style/index.css'
import './style/transitions.css'
import './style/ansi.css'
import 'floating-vue/dist/style.css'

import { createApp } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import FloatingVue from 'floating-vue'
import App from './App.vue'
import { router } from './router'
import { apolloClient } from './apollo'

const app = createApp(App)
app.provide(DefaultApolloClient, apolloClient)
app.use(router)
app.use(FloatingVue, {
  themes: {
    tooltip: {
      instantMove: true,
      delay: {
        show: 500,
        hide: 300,
      },
    },
    dropdown: {
      computeTransformOrigin: true,
    },
  },
})
app.mount('#app')
