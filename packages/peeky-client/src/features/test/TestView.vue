<script lang="ts" setup>
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import StatusIcon from '../StatusIcon.vue'

const route = useRoute()

const testViewFragment = gql`
fragment testView on Test {
  id
  title
  status
  duration
  error {
    message
    stack
    snippet
    line
    col
  }
}
`

const { result, subscribeToMore, onResult } = useQuery(() => gql`
  query test ($runId: ID!, $suiteSlug: String!, $testSlug: String!) {
    run (id: $runId) {
      id
      testSuite: testSuiteBySlug (slug: $suiteSlug) {
        id
        runTestFile {
          id
          testFile {
            id
            relativePath
          }
        }
        test: testBySlug (slug: $testSlug) {
          ...testView
        }
      }
    }
  }
  ${testViewFragment}
`, () => ({
  runId: route.params.runId,
  suiteSlug: route.params.suiteSlug,
  testSlug: route.params.testSlug,
}), {
  fetchPolicy: 'cache-and-network',
})

const suite = useResult(result, null, data => data.run.testSuite)
const test = useResult(result, null, data => data.run.testSuite.test)

subscribeToMore(() => ({
  document: gql`
  subscription testUpdated ($runId: ID!, $testSlug: String!) {
    testUpdatedBySlug (runId: $runId, testSlug: $testSlug) {
      ...testView
    }
  }
  ${testViewFragment}
  `,
  variables: {
    runId: route.params.runId,
    testSlug: route.params.testSlug,
  },
  updateQuery: (prev, { subscriptionData: { data } }) => {
    return {
      ...prev,
      run: {
        ...prev.run,
        testSuite: {
          ...prev.run.testSuite,
          test: {
            ...data.testUpdatedBySlug,
          },
        },
      },
    }
  },
}))
</script>

<template>
  <div
    v-if="test"
    class="divide-y divide-gray-100 dark:divide-gray-800 h-full flex flex-col"
  >
    <div class="flex items-center space-x-2 h-10 px-3 flex-none">
      <StatusIcon
        :status="test.status"
        class="w-4 h-4 flex-none"
      />
      <span class="flex-1 truncate py-1">
        {{ test.title }}
      </span>
      <span
        v-if="test.duration != null"
        class="text-black dark:text-white opacity-40"
      >
        {{ test.duration }}ms
      </span>
    </div>

    <router-view
      v-if="test"
      :test="test"
      :suite="suite"
      class="overflow-y-auto flex-1"
    />
  </div>
</template>
