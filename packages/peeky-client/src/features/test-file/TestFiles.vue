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
import { computed, ref } from 'vue'
import { useQuery, useResult } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'

const route = useRoute()

const { result, subscribeToMore } = useQuery(() => route.params.runId !== 'last-run' ? gql`
  query runTestFilesSpecific ($id: ID!) {
    run (id: $id) {
      id
      runTestFiles {
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
    }
  }
  ${runTestFileListFragment}
`, () => route.params.runId !== 'last-run' ? {
  id: route.params.runId,
} : {})
const testFiles = useResult(result, [], data => data.run.runTestFiles)

// Filtering
const searchText = ref('')
const filteredFiles = computed(() => {
  if (!searchText.value) {
    return testFiles.value
  } else {
    const reg = new RegExp(searchText.value, 'i')
    return testFiles.value.filter(f => f.testFile.relativePath.search(reg) !== -1)
  }
})

// Sorting
const sortedFiles = computed(() => filteredFiles.value.slice().sort(
  (a, b) => a.testFile.relativePath.localeCompare(b.testFile.relativePath),
))

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
    </div>
  </div>
</template>
