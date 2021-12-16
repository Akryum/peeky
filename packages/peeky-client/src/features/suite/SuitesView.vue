<script lang="ts" setup>
import BaseSplitPane from '../BaseSplitPane.vue'
import BaseInput from '../BaseInput.vue'
import SuiteItem from './SuiteItem.vue'
import { SearchIcon } from '@zhuowenli/vue-feather-icons'
import { computed, defineProps, ref } from 'vue'
import { compareStatus } from '../../util/status'

const props = defineProps<{
  suites: any[]
  run: any
}>()

const searchText = ref('')
const searchReg = computed(() => searchText.value ? new RegExp(searchText.value, 'gi') : null)
const filterFailed = ref(false)

const failedTestCount = computed(() => {
  return props.suites.reduce((sum, suite) => {
    return sum + suite.tests.reduce((sum, test) => {
      return sum + (test.status === 'error' ? 1 : 0)
    }, 0)
  }, 0)
})

const sortedSuites = computed(() => props.suites.slice().sort((a, b) => compareStatus(a.status, b.status)))
</script>

<template>
  <BaseSplitPane
    :default-split="25"
    :min="5"
    :max="70"
    save-id="peeky-run-test-file-view"
    class="h-full"
  >
    <template #first>
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
            v-for="suite of sortedSuites"
            :key="suite.id"
            :suite="suite"
            :run="run"
            :search="{
              searchReg,
              filterFailed,
            }"
            :depth="0"
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

    <template #last>
      <router-view />
    </template>
  </BaseSplitPane>
</template>
