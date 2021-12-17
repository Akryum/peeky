<script lang="ts" setup>
import {
  CircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
  ChevronsRightIcon,
  EditIcon,
} from '@zhuowenli/vue-feather-icons'
import { defineProps } from 'vue'
import type { TestStatus } from '../util/status'

const icons: Record<TestStatus, any> = {
  idle: CircleIcon,
  in_progress: ClockIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  skipped: ChevronsRightIcon,
  todo: EditIcon,
}

const classes: Record<TestStatus, string> = {
  idle: 'text-gray-300 dark:text-gray-700',
  in_progress: 'text-primary-500',
  success: 'text-green-500',
  error: 'text-red-500',
  skipped: 'text-gray-300 dark:text-gray-700',
  todo: 'text-yellow-500',
}

const bgClasses: Record<TestStatus, string> = {
  idle: 'bg-gray-300 dark:bg-gray-700',
  in_progress: 'bg-primary-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  skipped: 'bg-gray-300 dark:bg-gray-700',
  todo: 'bg-yellow-500',
}

const smallIcons: Omit<Record<TestStatus, any>, 'idle'> = {
  in_progress: ClockIcon,
  success: CheckIcon,
  error: XIcon,
  skipped: ChevronsRightIcon,
  todo: EditIcon,
}

const smallClasses: Omit<Record<TestStatus, string>, 'idle'> = {
  in_progress: 'bg-primary-500 text-white',
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  skipped: 'bg-gray-300 dark:bg-gray-700 text-white',
  todo: 'bg-yellow-500 text-white',
}

const tooltips: Record<TestStatus, string> = {
  idle: 'Idle',
  in_progress: 'In progress',
  success: 'Success',
  error: 'Error',
  skipped: 'Skipped',
  todo: 'Todo',
}

const props = defineProps({
  status: {
    type: String,
    required: true,
  },

  icon: {},

  iconClass: {},

  bg: {
    type: Boolean,
    default: false,
  },

  pill: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    v-tooltip="!pill && tooltips[status]"
    class="flex space-x-2"
  >
    <div
      class="relative"
      :class="[
        {
          [bgClasses[status] + ' rounded-full !bg-opacity-25']: bg,
        },
        iconClass,
      ]"
    >
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

    <div
      v-if="pill"
      class="rounded-full !bg-opacity-25 px-2"
      :class="[
        bgClasses[status],
        classes[status]
      ]"
    >
      {{ tooltips[status] }}
    </div>
  </div>
</template>
