<script lang="ts" setup>
import { useMutation, useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { EditIcon } from '@zhuowenli/vue-feather-icons'
import BaseButton from '../BaseButton.vue'
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
        runTestFile {
          id
          slug
          status
          duration
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
    <div class="flex">
      <TestFileItem
        :file="suite.runTestFile"
        class="!h-8 m-1 rounded flex-shrink"
      />
    </div>

    <div class="flex items-center space-x-2 h-10 px-4 flex-none">
      <StatusIcon
        :status="test.status"
        class="flex-none"
        icon-class="w-5 h-5"
        pill
      />
      <span class="flex-shrink truncate py-1">
        {{ suite.title }} ›
        {{ test.title }}
      </span>
      <Duration
        v-if="test.duration != null"
        :duration="test.duration"
      />

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

    <router-view
      v-if="test"
      :test="test"
      :suite="suite"
      class="overflow-y-auto flex-1"
    />
  </div>
</template>
