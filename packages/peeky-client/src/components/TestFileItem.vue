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
    />
    <span class="flex-1">
      {{ file.relativePath }}
    </span>
  </div>
</template>
