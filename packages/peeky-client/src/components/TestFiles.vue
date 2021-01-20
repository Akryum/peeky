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

// Subscriptions
subscribeToMore({
  document: gql`
    subscription testFileUpdated {
      testFileUpdated {
        ...testFileList
      }
    }
    ${testFileListFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (previousResult.testFiles.find(f => f.id === data.testFileUpdated.id)) return previousResult
    return {
      testFiles: [
        ...previousResult.testFiles,
        data.testFileUpdated,
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
        v-for="file of filteredFiles"
        :key="file.id"
        :file="file"
      />
    </div>
  </div>
</template>
