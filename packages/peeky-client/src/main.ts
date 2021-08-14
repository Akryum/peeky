import './style/vars.css'
import './style/index.css'
import './style/transitions.css'
import './style/ansi.css'
import { createApp, provide } from 'vue'
import App from './App.vue'
import { router } from './router'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'

const app = createApp({
  extends: App,
  setup () {
    provide(DefaultApolloClient, apolloClient)
  },
})
app.use(router)
app.mount('#app')
