<script lang="ts">
import { computed, defineProps, ref } from 'vue'

const filterFailed = ref(false)
</script>

<script lang="ts" setup>
import BaseInput from '../BaseInput.vue'
import SuiteItem from './SuiteItem.vue'
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
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
      }).filter(child => isNestedMatching(child))
    }
  }

  const rootSuites = props.suites.filter(s => s.root)
  return rootSuites.map(suite => processSuite(suite))
})
</script>

<template>
  <div class="h-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
    <slot name="toolbar" />

    <div class="flex-none h-10">
      <BaseInput
        v-model="searchText"
        size="md"
        placeholder="Filter tests..."
        class="h-full"
      >
        <template #after>
          <button
            v-tooltip="'Click to filter on failed tests'"
            class="text-xs px-2 rounded cursor-pointer leading-tight"
            :class="[
              filterFailed ? 'text-red-200 bg-red-600 font-bold' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
            ]"
            @click="filterFailed = !filterFailed"
          >
            {{ failedTestCount }}
          </button>

          <SearchIcon class="mx-3 text-gray-500" />
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
  </div>
</template>
