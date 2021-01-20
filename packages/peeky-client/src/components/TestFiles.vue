<script lang="ts">
import gql from 'graphql-tag'

export const testFileListFragment = gql`
fragment testFileList on TestFile {
  id
  relativePath
  status
  deleted
}
`
</script>

<script lang="ts" setup>
import BaseInput from './BaseInput.vue'
import TestFileItem from './TestFileItem.vue'
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
import { computed, ref } from 'vue'
import { useQuery, useResult } from '@vue/apollo-composable'

const { result, subscribeToMore } = useQuery(gql`
  query allTestFiles {
    testFiles {
      ...testFileList
    }
  }
  ${testFileListFragment}
`)
const testFiles = useResult(result, [])

// Filtering
const searchText = ref('')
const filteredFiles = computed(() => {
  if (!searchText.value) {
    return testFiles.value
  } else {
    const reg = new RegExp(searchText.value, 'i')
    return testFiles.value.filter(f => reg.test(f.relativePath))
  }
})

// Sorting
const sortedFiles = computed(() => filteredFiles.value.slice().sort(
  (a, b) => a.relativePath.localeCompare(b.relativePath)
))

// Subscriptions

// Test file added
subscribeToMore({
  document: gql`
    subscription testFileAdded {
      testFileAdded {
        ...testFileList
      }
    }
    ${testFileListFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (previousResult.testFiles.find(f => f.id === data.testFileAdded.id)) return previousResult
    return {
      testFiles: [
        ...previousResult.testFiles,
        data.testFileAdded,
      ],
    }
  },
})

// Test file updated
subscribeToMore({
  document: gql`
    subscription testFileUpdated {
      testFileUpdated {
        ...testFileList
      }
    }
    ${testFileListFragment}
  `,
})

// Test file removed
subscribeToMore({
  document: gql`
    subscription testFileRemoved {
      testFileRemoved {
        ...testFileList
      }
    }
    ${testFileListFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    return {
      testFiles: [
        ...previousResult.testFiles.filter(f => f.id !== data.testFileRemoved.id),
      ],
    }
  },
})
</script>

<template>
  <div class="flex flex-col divide-y divide-gray-100">
    <div class="flex-none">
      <BaseInput
        v-model="searchText"
        size="md"
        placeholder="Filter test files..."
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
