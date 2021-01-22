<script lang="ts" setup>
import TestItem from './TestItem.vue'
import StatusIcon from './StatusIcon.vue'
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
    <div class="flex items-center space-x-2 h-8 px-3">
      <StatusIcon
        :status="suite.status"
        class="w-4 h-4 flex-none"
      />
      <span class="flex-1 truncate py-1">
        {{ suite.title }}
      </span>
      <span
        v-if="suite.duration != null"
        class="flex-none text-gray-300 dark:text-gray-700"
      >
        {{ suite.duration }}ms
      </span>
    </div>

    <div class="pl-4">
      <TestItem
        v-for="test of filteredTests"
        :key="test.id"
        :test="test"
        :run="run"
      />
    </div>
  </div>
</template>
