<script lang="ts" setup>
import {
  CircleIcon,
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@zhuowenli/vue-feather-icons'
import { defineProps } from 'vue'

const props = defineProps({
  status: String,
})
</script>

<template>
  <div>
    <CircleIcon
      v-if="status === 'idle'"
      class="text-gray-300 dark:text-gray-700 w-full h-full"
    />
    <LoaderIcon
      v-if="status === 'in_progress'"
      class="text-purple-500 w-full h-full"
    />
    <CheckCircleIcon
      v-if="status === 'success'"
      class="text-green-500 w-full h-full"
    />
    <XCircleIcon
      v-if="status === 'error'"
      class="text-red-500 w-full h-full"
    />
  </div>
</template>
