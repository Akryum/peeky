<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { defineProps } from 'vue'

const props = defineProps({
  file: Object,
})
</script>

<template>
  <div class="px-3 py-1 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 space-x-2">
    <StatusIcon
      :status="file.status"
      class="w-4 h-4"
    />
    <span class="flex-1">
      {{ file.relativePath }}
    </span>
    <span
      v-if="file.duration != null"
      class="flex-none text-gray-300 dark:text-gray-700"
    >
      {{ file.duration }}ms
    </span>
  </div>
</template>
