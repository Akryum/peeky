<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import SuitesView from '../suite/SuitesView.vue'
import { testItemFragment } from '../test/TestItem.vue'
import { testSuiteItemFragment } from '../suite/SuiteItem.vue'

const route = useRoute()

const runTestFileAllSuiteFragment = gql`
fragment runTestFileAllSuite on TestSuite {
  ...testSuiteItem
  root
  children {
    ...on TestSuite {
      id
    }
    ...on Test {
      ...testItem
    }
  }
}
${testSuiteItemFragment}
${testItemFragment}
`

const { result, subscribeToMore, onResult } = useQuery(() => route.params.runId !== 'last-run'
  ? gql`
  query testFileAllView ($runId: ID!) {
    run (id: $runId) {
      id
      testSuites: allTestSuites {
        ...runTestFileAllSuite
      }
    }
  }
  ${runTestFileAllSuiteFragment}
`
  : gql`
  query testFileAllViewLastRun {
    run: lastRun {
      id
      testSuites: allTestSuites {
        ...runTestFileAllSuite
      }
    }
  }
  ${runTestFileAllSuiteFragment}
`, () => ({
  ...route.params.runId !== 'last-run'
    ? {
      runId: route.params.runId,
    }
    : {},
}), {
  fetchPolicy: 'cache-and-network',
})

const run = computed(() => result.value?.run)

subscribeToMore(() => ({
  document: gql`
  subscription testSuiteAddedToRun ($runId: ID!) {
    testSuiteAdded(runId: $runId) {
      ...runTestFileAllSuite
    }
  }
  ${runTestFileAllSuiteFragment}
  `,
  variables: {
    runId: route.params.runId,
  },
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    return {
      run: {
        ...previousResult.run,
        testSuites: [
          ...previousResult.run.testSuites ?? [],
          data.testSuiteAdded,
        ],
      },
    }
  },
}))

subscribeToMore(() => ({
  document: gql`
  subscription testUpdatedToRunTestFileAllView ($runId: ID!) {
    testUpdatedInRun(runId: $runId) {
      ...testItem
    }
  }
  ${testItemFragment}
  `,
  variables: {
    runId: route.params.runId,
  },
}))

subscribeToMore(() => ({
  document: gql`
  subscription testSuiteCompletedToRunTestFileAllView ($runId: ID!) {
    testSuiteCompleted (runId: $runId) {
      id
      status
      duration
      children {
        ...on Test {
          id
          status
          duration
        }
      }
    }
  }
  `,
  variables: {
    runId: route.params.runId,
  },
}))
</script>

<template>
  <SuitesView
    v-if="run"
    :suites="run.testSuites"
    :run="run"
  />
</template>
