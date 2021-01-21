import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Dashboard,
      children: [
        {
          path: '',
          name: 'home',
          redirect: { name: 'last-run' },
        },
        {
          path: 'last-run',
          name: 'last-run',
          component: { render: () => '' },
        },
        {
          path: 'run/:runId',
          name: 'run',
          component: { render: () => '' },
        },
      ],
    },
  ],
})
