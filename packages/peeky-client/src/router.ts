import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import TestFileView from './components/TestFileView.vue'

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
          redirect: { name: 'run', params: { runId: 'last-run' } },
        },
        {
          path: 'run/:runId',
          component: RouterView,
          children: [
            {
              path: '',
              name: 'run',
              component: RouterView,
            },
            {
              path: 'file/:slug',
              name: 'run-test-file',
              component: TestFileView,
            },
          ],
        },
      ],
    },
  ],
})
