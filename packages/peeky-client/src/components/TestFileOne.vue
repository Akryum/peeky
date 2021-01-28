<script lang="ts" setup>
import SuitesView from './SuitesView.vue'
import TestFileToolbar from './TestFileToolbar.vue'
import { testItemFragment } from './TestItem.vue'
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
  runTestFile {
    id
    testFile {
      id
      relativePath
    }
  }
  tests {
    ...testItem
  }
}
${testItemFragment}
`

const runTestFileViewFragment = gql`
fragment runTestFileView on RunTestFile {
  id
  status
  duration
  error {
    message
  }
  testFile {
    id
    relativePath
  }
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

    subscribeToMore(() => ({
      document: gql`
      subscription testUpdatedToRunTestFileView ($runId: ID!, $fileId: ID!) {
        testUpdated(runId: $runId, runTestFileId: $fileId) {
          ...testItem
        }
      }
      ${testItemFragment}
      `,
      variables: {
        runId: run.value?.id,
        fileId: runTestFile.value?.id,
      },
    }))
  }
})
</script>

<template>
  <template v-if="runTestFile">
    <SuitesView
      v-if="!runTestFile.error"
      :suites="runTestFile.suites"
      :run="run"
    >
      <template #toolbar>
        <TestFileToolbar
          :file="runTestFile"
        />
      </template>
    </SuitesView>

    <div
      v-else
      class="flex flex-col divide-y divide-gray-100 dark:divide-gray-900"
    >
      <TestFileToolbar
        :file="runTestFile"
        class="flex-none"
      />

      <div class="flex-1 flex flex-col p-4 space-y-2">
        <div class="text-xl text-blush-500">
          😿️ Running tests failed:
        </div>
        <pre class="bg-blush-50 text-blush-600 px-4 py-3 rounded text-sm">{{ runTestFile.error.message }}</pre>
      </div>
    </div>
  </template>
</template>
