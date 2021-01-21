<script lang="ts" setup>
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'

const route = useRoute()

const runTestFileViewSuiteFragment = gql`
fragment runTestFileViewSuite on TestSuite {
  id
  title
  status
  duration
  tests {
    id
    title
    status
    duration
    error {
      message
      stack
    }
  }
}
`

const runTestFileViewFragment = gql`
fragment runTestFileView on RunTestFile {
  id
  suites {
    ...runTestFileViewSuite
  }
}
${runTestFileViewSuiteFragment}
`

const { result, subscribeToMore, onResult } = useQuery(() => route.params.runId !== 'last-run' ? gql`
  query testFileView ($runId: ID!, $fileSlug: String!) {
    run (id: $runId) {
      id
      runTestFile (slug: $fileSlug) {
        ...runTestFileView
      }
    }
  }
  ${runTestFileViewFragment}
` : gql`
  query testFileViewLastRun ($fileSlug: String!) {
    run: lastRun {
      id
      runTestFile (slug: $fileSlug) {
        ...runTestFileView
      }
    }
  }
  ${runTestFileViewFragment}
`, () => ({
  fileSlug: route.params.slug,
  ...route.params.runId !== 'last-run' ? {
    runId: route.params.runId,
  } : {},
}), {
  fetchPolicy: 'cache-and-network',
})

const run = useResult(result, null)
const runTestFile = useResult(result, null, data => data.run.runTestFile)

let initSub = false
onResult(({ data }) => {
  if (data.run && !initSub) {
    initSub = true

    subscribeToMore(() => ({
      document: gql`
      subscription testSuiteAddedToRunTestFileView ($runId: ID!, $fileId: ID!) {
        testSuiteAdded(runId: $runId, runTestFileId: $fileId) {
          ...runTestFileViewSuite
        }
      }
      ${runTestFileViewSuiteFragment}
      `,
      variables: {
        runId: run.value?.id,
        fileId: runTestFile.value?.id,
      },
      updateQuery: (previousResult, { subscriptionData: { data } }) => {
        return {
          run: {
            ...previousResult.run,
            runTestFile: {
              ...previousResult.run.runTestFile,
              suites: [
                ...previousResult.run.runTestFile.suites,
                data.testSuiteAdded,
              ],
            },
          },
        }
      },
    }))
  }
})
</script>

<template>
  {{ runTestFile }}
</template>
