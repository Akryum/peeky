<script lang="ts" setup>
import {
  CircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
  ChevronsRightIcon,
} from '@zhuowenli/vue-feather-icons'
import { defineProps } from 'vue'

const icons = {
  idle: CircleIcon,
  // eslint-disable-next-line @typescript-eslint/camelcase
  in_progress: ClockIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  skipped: ChevronsRightIcon,
}

const classes = {
  idle: 'text-gray-300 dark:text-gray-700',
  // eslint-disable-next-line @typescript-eslint/camelcase
  in_progress: 'text-purple-500',
  success: 'text-green-500',
  error: 'text-red-500',
  skipped: 'text-gray-300 dark:text-gray-700',
}

const smallIcons = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  in_progress: ClockIcon,
  success: CheckIcon,
  error: XIcon,
  skipped: ChevronsRightIcon,
}

const smallClasses = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  in_progress: 'bg-purple-500 text-white',
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  skipped: 'bg-gray-300 dark:bg-gray-700 text-white',
}

const props = defineProps({
  status: {
    type: String,
    required: true,
  },

  icon: {},
})
</script>

<template>
  <div class="relative">
    <component
      :is="icon || icons[status]"
      :key="status"
      class=" w-full h-full stroke-current"
      :class="classes[status]"
    />

    <div
      v-if="icon && smallIcons[status]"
      class="absolute bottom-0 right-0 -m-0.5 rounded-full w-3/5 h-3/5"
      :class="smallClasses[status]"
    >
      <component
        :is="smallIcons[status]"
        class="w-full h-full stroke-current"
      />
    </div>
  </div>
</template>
