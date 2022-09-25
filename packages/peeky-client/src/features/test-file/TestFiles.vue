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
  envName
}
`
</script>

<script lang="ts" setup>
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
import { computed, Ref, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import BaseInput from '../BaseInput.vue'
import TestFileItem from './TestFileItem.vue'

const route = useRoute()

const { result, subscribeToMore } = useQuery(() => route.params.runId !== 'last-run'
  ? gql`
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
`
  : gql`
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
`, () => route.params.runId !== 'last-run'
  ? {
    id: route.params.runId,
  }
  : {})
const testFiles = computed(() => result.value?.run.runTestFiles ?? [])
const previousErrorFiles = computed(() => result.value?.run.previousErrorRunTestFiles ?? [])

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
const compare = (a, b) => a.testFile.relativePath.localeCompare(b.testFile.relativePath)
const sortedFiles = computed(() => filteredFiles.value.slice().sort(compare))
const sortedPreviousFiles = computed(() => filteredPreviousFiles.value.slice().sort(compare))

const groups = [
  { status: 'error' },
  { status: 'in_progress' },
  { status: 'todo' },
  { status: 'success' },
  { status: 'skipped' },
]

const groupedFiles = computed(() => groups.reduce((acc, item) => {
  acc[item.status] = sortedFiles.value.filter(f => f.status === item.status)
  return acc
}, {} as Record<(typeof groups)[number]['status'], any[]>))

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
  <div class="flex-none h-10 bg-gray-50 dark:bg-gray-950">
    <BaseInput
      v-model="searchText"
      size="md"
      placeholder="Filter test files..."
      class="h-full"
    >
      <template #before>
        <SearchIcon class="ml-2 text-gray-500 w-4 h-4" />
      </template>
    </BaseInput>
  </div>
  <div class="flex-1 overflow-y-auto">
    <div
      v-if="groupedFiles.error.length"
      class="py-2"
    >
      <div class="text-red-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-red-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>Errors</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-red-500/40 mt-0.5">{{ groupedFiles.error.length }}</span>
        </div>
        <div class="h-[1px] bg-red-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of groupedFiles.error"
        :key="file.id"
        :file="file"
      />
    </div>

    <div
      v-if="sortedPreviousFiles.length"
      class="py-2"
    >
      <div class="text-red-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-red-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>Previous errors</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-red-500/40 mt-0.5">{{ sortedPreviousFiles.length }}</span>
        </div>
        <div class="h-[1px] bg-red-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of sortedPreviousFiles"
        :key="file.id"
        :file="file"
        previous
        class="opacity-70"
      />
    </div>

    <div
      v-if="groupedFiles.in_progress.length"
      class="py-2"
    >
      <div class="text-primary-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-primary-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>In progress</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-primary-500/40 mt-0.5">{{ groupedFiles.in_progress.length }}</span>
        </div>
        <div class="h-[1px] bg-primary-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of groupedFiles.in_progress"
        :key="file.id"
        :file="file"
      />
    </div>

    <div
      v-if="groupedFiles.todo.length"
      class="py-2"
    >
      <div class="text-yellow-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-yellow-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>Todo</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-yellow-500/40 mt-0.5">{{ groupedFiles.todo.length }}</span>
        </div>
        <div class="h-[1px] bg-yellow-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of groupedFiles.todo"
        :key="file.id"
        :file="file"
      />
    </div>

    <div
      v-if="groupedFiles.success.length"
      class="py-2"
    >
      <div class="text-green-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-green-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>Success</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-green-500/40 mt-0.5">{{ groupedFiles.success.length }}</span>
        </div>
        <div class="h-[1px] bg-green-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of groupedFiles.success"
        :key="file.id"
        :file="file"
      />
    </div>

    <div
      v-if="groupedFiles.skipped.length"
      class="py-2"
    >
      <div class="text-gray-500 flex items-center space-x-2 px-2 pb-1">
        <div class="h-[1px] bg-gray-500/20 flex-1" />
        <div class="flex items-center space-x-1">
          <span>Skipped</span>
          <span class="text-sm px-1.5 rounded-full leading-tight border border-gray-500/40 mt-0.5">{{ groupedFiles.skipped.length }}</span>
        </div>
        <div class="h-[1px] bg-gray-500/20 flex-1" />
      </div>
      <TestFileItem
        v-for="file of groupedFiles.skipped"
        :key="file.id"
        :file="file"
      />
    </div>
  </div>
</template>
