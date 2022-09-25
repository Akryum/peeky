<script lang="ts" setup>
import BaseButton from '../BaseButton.vue'
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
import { ArrowLeftIcon, FileIcon } from '@zhuowenli/vue-feather-icons'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="flex-none flex items-center space-x-2 pl-1 pr-3 h-10 bg-gray-50 dark:bg-gray-950">
    <BaseButton
      flat
      color="gray"
      class="flex-none p-2"
      @click="$router.push({ query: { ...$route.query, fileSlug: undefined } })"
    >
      <ArrowLeftIcon class="w-4 h-4" />
    </BaseButton>

    <StatusIcon
      :status="file.status"
      :icon="FileIcon"
      class="w-5 h-5"
    />
    <span class="flex-1 truncate py-1">
      {{ file.testFile.relativePath }}
    </span>
    <Duration
      v-if="file.duration != null"
      :duration="file.duration"
    />
  </div>
</template>
