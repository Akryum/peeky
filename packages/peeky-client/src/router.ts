import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Dashboard from './features/Dashboard.vue'
import TestFileAllView from './features/test-file/TestFileAllView.vue'
import TestFileOneView from './features/test-file/TestFileOneView.vue'

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
              component: TestFileAllView,
            },
            {
              path: 'file/:slug',
              name: 'run-test-file',
              component: TestFileOneView,
            },
          ],
        },
      ],
    },
  ],
})
