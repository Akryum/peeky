import './style/vars.css'
import './style/index.css'
import './style/transitions.css'
import './style/ansi.css'
import 'v-tooltip/dist/v-tooltip.css'

import { createApp, provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import VTooltip from 'v-tooltip'
import App from './App.vue'
import { router } from './router'
import { apolloClient } from './apollo'

const app = createApp({
  extends: App,
  setup () {
    provide(DefaultApolloClient, apolloClient)
  },
})
app.use(router)
app.use(VTooltip, {
  themes: {
    dropdown: {
      computeTransformOrigin: true,
    },
  },
})
app.mount('#app')
