<script lang="ts" setup>
import {
  CircleIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  ChevronsRightIcon,
  Edit2Icon,
} from '@zhuowenli/vue-feather-icons'
import type { TestStatus } from '../util/status'

const icons: Record<TestStatus, any> = {
  in_progress: ClockIcon,
  success: CheckIcon,
  error: XIcon,
  skipped: ChevronsRightIcon,
  todo: Edit2Icon,
}

const classes: Record<TestStatus, string> = {
  in_progress: 'text-primary-500',
  success: 'text-green-500',
  error: 'text-red-500',
  skipped: 'text-gray-300 dark:text-gray-700',
  todo: 'text-yellow-500',
}

const bgClasses: Record<TestStatus, string> = {
  in_progress: 'bg-primary-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  skipped: 'bg-gray-300 dark:bg-gray-700',
  todo: 'bg-yellow-500',
}

const tooltips: Record<TestStatus, string> = {
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
        v-if="icon && icons[status]"
        class="absolute bottom-[2px] left-0 w-full flex items-center justify-center"
      >
        <component
          :is="icons[status]"
          :class="classes[status]"
          class="w-[10px] h-[10px]"
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
