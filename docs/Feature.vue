<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },

  icon: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="flex items-start space-x-4 bg-primary-50 p-4 rounded relative">
    <div class="mt-2 p-2 bg-primary-200 text-primary-700 rounded-full flex items-center justify-center">
      <span
        class="fe"
        :class="`fe-${icon}`"
      />
    </div>
    <div>
      <div class="font-medium text-primary-800">
        {{ title }}
      </div>
      <slot />
    </div>

    <div
      v-if="status"
      class="absolute top-3 right-3 text-xs px-1.5 rounded-full"
      :class="{
        'bg-red-600 text-white': status === 'new',
        'bg-orange-400 text-white': status === 'soon',
        'bg-primary-400 text-white': status === 'wip',
      }"
    >
      {{ status }}
    </div>
  </div>
</template>
