<script lang="ts">
import gql from 'graphql-tag'

export const runTestFileListFragment = gql`
fragment runTestFileList on RunTestFile {
  id
  slug
  status
  duration
  testFile {
    id
    relativePath
    deleted
  }
}
`
</script>

<script lang="ts" setup>
import BaseInput from '../BaseInput.vue'
import TestFileItem from './TestFileItem.vue'
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
import { computed, Ref, ref } from 'vue'
import { useQuery, useResult } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { compareStatus } from '../../util/status'

const route = useRoute()

const { result, subscribeToMore } = useQuery(() => route.params.runId !== 'last-run' ? gql`
  query runTestFilesSpecific ($id: ID!) {
    run (id: $id) {
      id
      runTestFiles {
        ...runTestFileList
      }

      previousErrorRunTestFiles {
        ...runTestFileList
      }
    }
  }
  ${runTestFileListFragment}
` : gql`
  query runTestFilesLastRun {
    run: lastRun {
      id
      runTestFiles {
        ...runTestFileList
      }

      previousErrorRunTestFiles {
        ...runTestFileList
      }
    }
  }
  ${runTestFileListFragment}
`, () => route.params.runId !== 'last-run' ? {
  id: route.params.runId,
} : {})
const testFiles = useResult(result, [], data => data.run.runTestFiles)
const previousErrorFiles = useResult(result, [], data => data.run.previousErrorRunTestFiles)

// Filtering
const searchText = ref('')
const createFilter = (target: Readonly<Ref<Readonly<any>>>) => {
  return () => {
    if (!searchText.value) {
      return target.value
    } else {
      const reg = new RegExp(searchText.value, 'i')
      return target.value.filter((f: any) => f.testFile.relativePath.search(reg) !== -1)
    }
  }
}
const filteredFiles = computed(createFilter(testFiles))
const filteredPreviousFiles = computed(createFilter(previousErrorFiles))

// Sorting
const compare = (a, b) => {
  const statusComparison = compareStatus(a.status, b.status)
  if (statusComparison !== 0) return statusComparison
  return a.testFile.relativePath.localeCompare(b.testFile.relativePath)
}
const sortedFiles = computed(() => filteredFiles.value.slice().sort(compare))
const sortedPreviousFiles = computed(() => filteredPreviousFiles.value.slice().sort(compare))

// Subscriptions

// Test file updated
subscribeToMore({
  document: gql`
    subscription runTestFileUpdated {
      runTestFileUpdated {
        ...runTestFileList
      }
    }
    ${runTestFileListFragment}
  `,
})
</script>

<template>
  <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
    <div class="flex-none">
      <BaseInput
        v-model="searchText"
        size="md"
        placeholder="Filter test files..."
        class="h-10"
      >
        <template #after>
          <SearchIcon class="mx-3 text-gray-500" />
        </template>
      </BaseInput>
    </div>
    <div class="flex-1 overflow-y-auto">
      <TestFileItem
        v-for="file of sortedFiles"
        :key="file.id"
        :file="file"
      />

      <template v-if="sortedPreviousFiles.length">
        <div class="flex items-center space-x-2 mt-3 mb-1">
          <div class="h-[1px] bg-gray-100 dark:bg-gray-900 flex-1" />
          <div class="flex-none text-gray-300 dark:text-gray-700">
            Previous errors
          </div>
          <div class="h-[1px] bg-gray-100 dark:bg-gray-900 flex-1" />
        </div>
        <TestFileItem
          v-for="file of sortedPreviousFiles"
          :key="file.id"
          :file="file"
          previous
          class="opacity-70"
        />
      </template>
    </div>
  </div>
</template>
