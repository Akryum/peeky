<script lang="ts" setup>
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
import { FileIcon } from '@zhuowenli/vue-feather-icons'

const props = defineProps({
  file: Object,
})
</script>

<template>
  <router-link
    :to="{
      query: {
        ...$route.query,
        fileSlug: file.slug,
      },
    }"
    class="px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 space-x-2 h-8"
    :class="{
      'active-colors': $route.query.fileSlug === file.slug,
    }"
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
    <Duration
      :duration="file.duration"
      :big="100"
      :huge="500"
      class="flex-none"
    />
  </router-link>
</template>
