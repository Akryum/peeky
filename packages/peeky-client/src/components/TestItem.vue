<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { defineProps } from 'vue'

const props = defineProps({
  test: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="flex items-center space-x-2 h-8 px-3">
    <StatusIcon
      :status="test.status"
      class="w-4 h-4 flex-none"
    />
    <span class="flex-1 truncate h-full flex items-center">
      {{ test.title }}
    </span>
    <span
      v-if="test.duration != null"
      class="text-gray-300 dark:text-gray-700"
    >
      {{ test.duration }}ms
    </span>
  </div>
</template>
