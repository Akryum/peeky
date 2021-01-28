<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { FileIcon } from '@zhuowenli/vue-feather-icons'
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
    class="px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 space-x-2 h-8"
  >
    <StatusIcon
      :status="file.status"
      :icon="FileIcon"
      class="w-5 h-5"
    />
    <span
      class="flex-1 truncate py-1"
      :class="{
        'path opacity-60': file.status === 'skipped',
      }"
    >
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
  @apply bg-flamingo-50 text-flamingo-800 dark:bg-flamingo-900 dark:text-flamingo-200;

  .path {
    @apply opacity-100;
  }
}
</style>
