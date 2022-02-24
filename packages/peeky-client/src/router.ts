import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Dashboard from './features/Dashboard.vue'
import TestView from './features/test/TestView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: RouterView,
      children: [
        {
          path: '',
          name: 'home',
          redirect: { name: 'run-test', params: { runId: 'last-run' } },
        },
        {
          path: 'run/:runId',
          component: Dashboard,
          children: [
            { path: '', redirect: { name: 'run-test' } },
            {
              path: 'tests',
              components: {
                default: () => import('./features/run/RunTestView.vue'),
                sidepane: () => import('./features/test-file/TestFiles.vue'),
              },
              children: [
                {
                  path: '',
                  name: 'run-test',
                  component: () => import('./features/test/TestViewPlaceholder.vue'),
                },
                {
                  path: 'test/:suiteSlug/:testSlug',
                  component: TestView,
                  children: [
                    {
                      path: '',
                      name: 'test',
                      component: () => import('./features/test/TestResult.vue'),
                    },
                    {
                      path: 'output',
                      name: 'test-output',
                      component: () => import('./features/test/TestOutput.vue'),
                    },
                    {
                      path: 'snapshots',
                      name: 'test-snapshots',
                      component: () => import('./features/test/TestSnapshots.vue'),
                    },
                    {
                      path: 'dom-preview',
                      name: 'test-dom-preview',
                      component: () => import('./features/test/TestDomPreview.vue'),
                    },
                  ],
                },
              ],
            },
            {
              path: 'snapshots',
              name: 'run-snapshot',
              components: {
                default: () => import('./features/snapshot/SnapshotSummaryView.vue'),
                sidepane: () => import('./features/snapshot/SnapshotSummaryList.vue'),
              },
            },
          ],
        },
      ],
    },
  ],
})
