<script lang="ts">
import { computed, defineProps, ref } from 'vue'

const filterFailed = ref(false)
</script>

<script lang="ts" setup>
import BaseInput from '../BaseInput.vue'
import SuiteItem from './SuiteItem.vue'
import { SearchIcon, XIcon } from '@zhuowenli/vue-feather-icons'
import { NexusGenFieldTypes } from '@peeky/server/types'

type TestSuite = Omit<NexusGenFieldTypes['TestSuite'], 'children'> & {
  __typename: 'TestSuite'
  children: (TestSuite | Test)[]
}

type Test = NexusGenFieldTypes['Test'] & {
  __typename: 'Test'
}

const props = defineProps<{
  suites: TestSuite[]
  run: any
}>()

// Filtering

const searchText = ref('')
const searchReg = computed(() => searchText.value ? new RegExp(searchText.value, 'gi') : null)

const failedTestCount = computed(() => {
  return props.suites.reduce((sum, suite) => {
    return sum + suite.children.reduce((sum, child) => {
      return sum + (child.__typename === 'Test' && child.status === 'error' ? 1 : 0)
    }, 0)
  }, 0)
})

function isChildMatching (item: TestSuite | Test) {
  // If one of the nested is in 'error', the suite is also in 'error'
  if (filterFailed.value && item.status !== 'error') return false
  // Title search
  if (searchReg.value && item.title.search(searchReg.value) === -1) return false
  return true
}

function isNestedMatching (item: TestSuite | Test) {
  if (isChildMatching(item)) return true
  if (item.__typename === 'TestSuite' && item.children.some(child => isNestedMatching(child))) return true
  return false
}

// Tree

const tree = computed(() => {
  if (!props.suites.length) return []

  function processSuite (item: TestSuite): TestSuite {
    return {
      ...item,
      children: item.children.map(child => {
        if (child.__typename === 'TestSuite') {
          return processSuite(props.suites.find(suite => suite.id === child.id) as TestSuite)
        }
        return child
      }).filter(child => isNestedMatching(child)),
    }
  }

  const rootSuites = props.suites.filter(s => s.root)
  return rootSuites.map(suite => processSuite(suite))
})
</script>

<template>
  <slot name="toolbar" />

  <div class="flex-none h-10 bg-gray-50 dark:bg-gray-950">
    <BaseInput
      v-model="searchText"
      size="md"
      placeholder="Filter tests..."
      class="h-full"
    >
      <template #before>
        <div class="ml-2">
          <SearchIcon class="text-gray-500 w-4 h-4" />
        </div>
      </template>

      <template #after>
        <div class="mr-2">
          <button
            v-tooltip="'Click to filter on failed tests'"
            class="text-xs px-1.5 rounded cursor-pointer leading-tight flex items-center space-x-0.5"
            :class="[
              filterFailed ? 'text-red-200 bg-red-600 font-bold' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
            ]"
            @click="filterFailed = !filterFailed"
          >
            <XIcon class="w-3 h-3" />
            <span class="mt-[1px]">{{ failedTestCount }}</span>
          </button>
        </div>
      </template>
    </BaseInput>
  </div>

  <div class="flex-1 overflow-y-auto">
    <SuiteItem
      v-for="suite of tree"
      :key="suite.id"
      :suite="suite"
      :run="run"
      :search="{
        searchReg,
        filterFailed,
      }"
      :depth="-1"
    />

    <div
      v-if="!suites.length"
      class="my-12 flex items-center justify-center"
    >
      <div class="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 text-center px-4 py-3 rounded">
        😿️ No test suites found
      </div>
    </div>
  </div>
</template>
