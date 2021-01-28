<script lang="ts" setup>
import StatusIcon from '../StatusIcon.vue'
import { defineProps } from 'vue'

const props = defineProps({
  run: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="flex items-center space-x-1 truncate px-3 h-10">
    <StatusIcon
      :status="run.status"
      class="w-4 h-4 mr-1"
    />
    <span class="flex-1 truncate py-1 space-x-1">
      <span>{{ run.title }}</span>
      <span>{{ run.emoji }}</span>
    </span>
    <span
      v-if="run.duration != null"
      class="text-gray-300 dark:text-gray-700"
    >{{ run.duration }}ms</span>
  </div>
</template>
