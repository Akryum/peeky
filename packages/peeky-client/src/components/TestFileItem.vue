<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { defineProps } from 'vue'

const props = defineProps({
  file: Object,
})
</script>

<template>
  <router-link
    :to="{
      name: 'run-test-file',
      params: {
        slug: file.slug,
      },
    }"
    class="px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 space-x-2"
  >
    <StatusIcon
      :status="file.status"
      class="w-4 h-4"
    />
    <span class="flex-1 truncate py-1">
      {{ file.testFile.relativePath }}
    </span>
    <span
      v-if="file.duration != null"
      class="flex-none text-gray-300 dark:text-gray-700"
    >
      {{ file.duration }}ms
    </span>
  </router-link>
</template>

<style scoped>
.router-link-active {
  @apply bg-purple-50 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}
</style>
