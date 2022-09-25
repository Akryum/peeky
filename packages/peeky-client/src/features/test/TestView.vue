<script lang="ts" setup>
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { EditIcon, HexagonIcon } from '@zhuowenli/vue-feather-icons'
import BaseButton from '../BaseButton.vue'
import BaseTab from '../BaseTab.vue'
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
import TestFileItem from '../test-file/TestFileItem.vue'
import { errorFragment } from './TestResult.vue'

const route = useRoute()

const testViewFragment = gql`
fragment testView on Test {
  id
  title
  status
  duration
  error {
    ...testResultError
  }
  hasLogs
  snapshotCount
  failedSnapshotCount
  envResult
  previewImports
}
${errorFragment}
`

const { result, subscribeToMore, onResult } = useQuery(() => gql`
  query test ($runId: ID!, $suiteSlug: String!, $testSlug: String!) {
    run (id: $runId) {
      id
      testSuite: testSuiteBySlug (slug: $suiteSlug) {
        id
        title
        allTitles
        runTestFile {
          id
          slug
          status
          duration
          testFile {
            id
            relativePath
          }
          envName
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
}), () => ({
  enabled: !!route.params.runId && !!route.params.suiteSlug && !!route.params.testSlug,
  fetchPolicy: 'cache-and-network',
}))

const suite = computed(() => result.value?.run.testSuite)
const test = computed(() => result.value?.run.testSuite.test)

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

const { mutate: openInEditor } = useMutation(gql`
mutation openInEditor ($id: ID!, $line: Int!, $col: Int!) {
  openTestFileInEditor (id: $id, line: $line, col: $col)
}
`)
</script>

<template>
  <div
    v-if="test"
    class="divide-y divide-gray-100 dark:divide-gray-800 h-full flex flex-col"
  >
    <div class="flex items-center gap-4 bg-gray-50 dark:bg-gray-950 pr-4">
      <TestFileItem
        :file="suite.runTestFile"
        class="!h-8 m-1 rounded shrink"
      />

      <div
        v-if="suite.runTestFile?.envName"
        v-tooltip="'Runtime environment'"
        class="flex gap-1 items-center"
      >
        <HexagonIcon class="opacity-50 w-4 h-4" />
        {{ suite.runTestFile.envName }}
      </div>

      <div class="flex-1 flex items-center space-x-2 justify-end">
        <BaseButton
          v-tooltip="'Open in your editor'"
          color="gray"
          flat
          class="flex-none p-2"
          @click="openInEditor({ id: suite.runTestFile.testFile.id, line: 1, col: 1 })"
        >
          <EditIcon class="w-4 h-4" />
        </BaseButton>
      </div>
    </div>

    <div class="flex items-center space-x-2 h-10 px-4 flex-none bg-gray-50 dark:bg-gray-950">
      <StatusIcon
        :status="test.status"
        class="flex-none"
        icon-class="w-5 h-5"
        pill
      />
      <span class="shrink truncate py-1">
        <span
          v-for="title of suite.allTitles.slice(1)"
          :key="title"
          class="opacity-70"
        >{{ title }} › </span>
        {{ test.title }}
      </span>
      <Duration
        v-if="test.duration != null"
        :duration="test.duration"
      />
    </div>

    <!-- Tabs -->
    <nav class="h-10 bg-gray-50 dark:bg-gray-950">
      <BaseTab
        :to="{
          name: 'test',
          query: { ...$route.query },
          params: { ...$route.params },
        }"
        exact
      >
        Result
      </BaseTab>
      <BaseTab
        :to="{
          name: 'test-output',
          query: { ...$route.query },
          params: { ...$route.params },
        }"
      >
        <div class="flex items-center space-x-2">
          <span>Output</span>
          <div
            v-if="test.hasLogs"
            class="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"
          />
        </div>
      </BaseTab>
      <BaseTab
        :to="{
          name: 'test-snapshots',
          query: { ...$route.query },
          params: { ...$route.params },
        }"
      >
        <div class="flex items-center space-x-2">
          <span>Snapshots</span>
          <div
            v-if="test.failedSnapshotCount"
            class="text-xs px-1.5 rounded-full leading-tight text-red-200 bg-red-600 mt-0.5"
          >
            {{ test.failedSnapshotCount }}
          </div>
          <div
            v-else-if="test.snapshotCount"
            class="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"
          />
        </div>
      </BaseTab>
      <BaseTab
        v-if="test.envResult?.html"
        :to="{
          name: 'test-dom-preview',
          query: { ...$route.query },
          params: { ...$route.params },
        }"
      >
        Preview
      </BaseTab>
    </nav>

    <router-view
      v-if="test"
      :test="test"
      :suite="suite"
      class="overflow-y-auto flex-1"
    />
  </div>
</template>
