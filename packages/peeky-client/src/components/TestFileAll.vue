<script lang="ts" setup>
import SuitesView from './SuitesView.vue'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'

const route = useRoute()

const runTestFileAllSuiteFragment = gql`
fragment runTestFileAllSuite on TestSuite {
  id
  title
  status
  duration
  runTestFile {
    id
    testFile {
      id
      relativePath
    }
  }
  tests {
    id
    title
    status
    duration
    error {
      message
      stack
      line
      col
    }
  }
}
`

const { result, subscribeToMore, onResult } = useQuery(() => route.params.runId !== 'last-run' ? gql`
  query testFileAllView ($runId: ID!) {
    run (id: $runId) {
      id
      testSuites {
        ...runTestFileAllSuite
      }
    }
  }
  ${runTestFileAllSuiteFragment}
` : gql`
  query testFileAllViewLastRun {
    run: lastRun {
      id
      testSuites {
        ...runTestFileAllSuite
      }
    }
  }
  ${runTestFileAllSuiteFragment}
`, () => ({
  ...route.params.runId !== 'last-run' ? {
    runId: route.params.runId,
  } : {},
}), {
  fetchPolicy: 'cache-and-network',
})

const run = useResult(result, null)

let initSub = false
onResult(({ data }) => {
  if (data.run && !initSub) {
    initSub = true

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
        runId: run.value.id,
      },
      updateQuery: (previousResult, { subscriptionData: { data } }) => {
        return {
          run: {
            ...previousResult.run,
            testSuites: [
              ...previousResult.run.testSuites,
              data.testSuiteAdded,
            ],
          },
        }
      },
    }))

    subscribeToMore(() => ({
      document: gql`
      subscription testUpdatedToRunTestFileAllView ($runId: ID!) {
        testUpdated(runId: $runId) {
          id
          status
          duration
          error {
            message
            stack
            line
            col
          }
        }
      }
      `,
      variables: {
        runId: run.value.id,
      },
    }))
  }
})
</script>

<template>
  <SuitesView
    v-if="run"
    :suites="run.testSuites"
    :run="run"
  />
</template>
