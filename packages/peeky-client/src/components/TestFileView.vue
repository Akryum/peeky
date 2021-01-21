<script lang="ts" setup>
import BaseSplitPane from './BaseSplitPane.vue'
import BaseInput from './BaseInput.vue'
import SuiteItem from './SuiteItem.vue'
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { ref, computed } from 'vue'
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

const searchText = ref('')
const searchReg = computed(() => searchText.value ? new RegExp(searchText.value, 'gi') : null)
</script>

<template>
  <BaseSplitPane
    v-if="runTestFile"
    :default-split="25"
    :min="5"
    :max="70"
    save-id="peeky-run-test-file-view"
    class="h-full"
  >
    <template #first>
      <div class="h-full flex flex-col divide-y divide-gray-100 dark:divide-gray-900">
        <div class="flex-none">
          <BaseInput
            v-model="searchText"
            size="md"
            placeholder="Filter tests..."
          >
            <template #after>
              <SearchIcon class="mx-3 text-gray-500" />
            </template>
          </BaseInput>
        </div>

        <div class="flex-1 overflow-y-auto">
          <SuiteItem
            v-for="suite of runTestFile.suites"
            :key="suite.id"
            :suite="suite"
            :search-reg="searchReg"
          />
        </div>
      </div>
    </template>

    <template #last>
      <div class="h-full flex items-center justify-center text-4xl">
        🐈️
      </div>
    </template>
  </BaseSplitPane>
</template>
