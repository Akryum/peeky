<script lang="ts" setup>
import TestItem from '../test/TestItem.vue'
import StatusIcon from '../StatusIcon.vue'
import { computed, defineProps } from 'vue'

const props = defineProps({
  suite: {
    type: Object,
    required: true,
  },

  run: {
    type: Object,
    required: true,
  },

  searchReg: {
    type: RegExp,
    default: null,
  },

  depth: {
    type: Number,
    required: true,
  },
})

const filteredTests = computed(() => {
  if (props.searchReg) {
    return props.suite.tests.filter(t => t.title.search(props.searchReg) !== -1)
  }
  return props.suite.tests
})
</script>

<template>
  <div v-if="!searchReg || filteredTests.length">
    <div
      class="flex items-center space-x-2 h-8 px-3"
      :style="{
        paddingLeft: `${depth * 16 + 6}px`,
      }"
    >
      <StatusIcon
        :status="suite.status"
        class="w-4 h-4 flex-none"
      />
      <span
        class="flex-1 truncate py-1"
        :class="{
          'opacity-60': suite.status === 'skipped',
        }"
      >
        {{ suite.title }}
      </span>
      <span
        v-if="suite.duration != null"
        class="flex-none text-black dark:text-white opacity-40"
      >
        {{ suite.duration }}ms
      </span>
    </div>

    <div
      v-if="!suite.tests.length"
      class="bg-gray-50  dark:bg-gray-900 text-gray-600 dark:text-gray-400 m-1 rounded relative text-sm"
    >
      <div class="absolute left-10 -top-1 w-3 h-3 transform rotate-45 bg-gray-100 dark:bg-gray-900" />

      <div class="relative px-2 py-1">
        😿️ No tests found in this suite
      </div>
    </div>

    <div>
      <TestItem
        v-for="test of filteredTests"
        :key="test.id"
        :test="test"
        :suite="suite"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>
