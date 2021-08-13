import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './features/Dashboard.vue'
import RunView from './features/run/RunView.vue'
import TestView from './features/test/TestView.vue'
import TestViewPlaceholder from './features/test/TestViewPlaceholder.vue'
import TestResult from './features/test/TestResult.vue'

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
          component: RunView,
          children: [
            {
              path: '',
              name: 'run',
              component: TestViewPlaceholder,
            },
            {
              path: 'test/:suiteSlug/:testSlug',
              component: TestView,
              children: [
                {
                  path: '',
                  name: 'test',
                  component: TestResult,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
