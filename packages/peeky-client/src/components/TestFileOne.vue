<script lang="ts" setup>
import TestFileItem from './TestFileItem.vue'
import BaseButton from './BaseButton.vue'
import SuitesView from './SuitesView.vue'
import StatusIcon from './StatusIcon.vue'
import { ArrowLeftIcon, FileIcon } from '@zhuowenli/vue-feather-icons'
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

const runTestFileViewFragment = gql`
fragment runTestFileView on RunTestFile {
  id
  status
  duration
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
        runId: run.value?.id,
        fileId: runTestFile.value?.id,
      },
    }))
  }
})
</script>

<template>
  <SuitesView
    v-if="runTestFile"
    :suites="runTestFile.suites"
    :run="run"
  >
    <template #toolbar>
      <div class="flex-none flex items-center space-x-2 pl-1 pr-3 h-10">
        <BaseButton
          flat
          color="gray"
          class="flex-none p-2"
          @click="$router.push({ name: 'run', params: { ...$route.params, slug: undefined } })"
        >
          <ArrowLeftIcon class="w-4 h-4" />
        </BaseButton>

        <StatusIcon
          :status="runTestFile.status"
          :icon="FileIcon"
          class="w-5 h-5"
        />
        <span class="flex-1 truncate py-1">
          {{ runTestFile.testFile.relativePath }}
        </span>
        <span
          v-if="runTestFile.duration != null"
          class="flex-none text-gray-300 dark:text-gray-700"
        >
          {{ runTestFile.duration }}ms
        </span>
      </div>
    </template>
  </SuitesView>
</template>
