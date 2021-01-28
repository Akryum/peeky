<script lang="ts" setup>
import BaseButton from '../BaseButton.vue'
import StatusIcon from '../StatusIcon.vue'
import { ArrowLeftIcon, FileIcon } from '@zhuowenli/vue-feather-icons'
import { defineProps } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="flex-none flex items-center space-x-2 pl-1 pr-3 h-10">
    <BaseButton
      flat
      color="gray"
      class="flex-none p-2"
      @click="$router.push({ name: 'run', params: { ...$route.params, slug: undefined } })"
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
    <span
      v-if="file.duration != null"
      class="flex-none text-gray-300 dark:text-gray-700"
    >
      {{ file.duration }}ms
    </span>
  </div>
</template>
