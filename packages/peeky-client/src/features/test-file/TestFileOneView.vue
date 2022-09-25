<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import SuitesView from '../suite/SuitesView.vue'
import TestFileToolbar from './TestFileToolbar.vue'
import { testItemFragment } from '../test/TestItem.vue'
import { testSuiteItemFragment } from '../suite/SuiteItem.vue'

const route = useRoute()

const runTestFileViewSuiteFragment = gql`
fragment runTestFileViewSuite on TestSuite {
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
  suites: allTestSuites {
    ...runTestFileViewSuite
  }
}
${runTestFileViewSuiteFragment}
`

const { result, subscribeToMore, onResult } = useQuery(() => route.params.runId !== 'last-run'
  ? gql`
  query testFileView ($runId: ID!, $fileSlug: String!) {
    run (id: $runId) {
      id
      runTestFile (slug: $fileSlug) {
        ...runTestFileView
      }
    }
  }
  ${runTestFileViewFragment}
`
  : gql`
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
  fileSlug: route.query.fileSlug,
  ...route.params.runId !== 'last-run'
    ? {
      runId: route.params.runId,
    }
    : {},
}), {
  fetchPolicy: 'cache-and-network',
})

const run = computed(() => result.value?.run)
const runTestFile = computed(() => result.value?.run.runTestFile)

let initSub = false
onResult(({ data }) => {
  if (data?.run && !initSub) {
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
        testUpdatedInRun(runId: $runId, runTestFileId: $fileId) {
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
      class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800"
    >
      <TestFileToolbar
        :file="runTestFile"
        class="flex-none"
      />

      <div class="flex-1 flex flex-col p-4 space-y-2">
        <div class="text-xl text-red-500">
          😿️ Running tests failed:
        </div>
        <pre class="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-4 py-3 rounded text-sm">{{ runTestFile.error.message }}</pre>
      </div>
    </div>
  </template>
</template>
