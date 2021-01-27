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
  <div class="flex items-start space-x-4 bg-orchid-50 p-4 rounded relative">
    <div class="mt-2 p-2 bg-flamingo-200 text-flamingo-700 rounded-full">
      <span
        class="fe"
        :class="`fe-${icon}`"
      />
    </div>
    <div>
      <div class="font-medium text-flamingo-800">
        {{ title }}
      </div>
      <slot />
    </div>

    <div
      v-if="status"
      class="absolute top-3 right-3 text-xs px-1 rounded-sm"
      :class="{
        'bg-blush-600 text-white': status === 'new',
        'bg-chocolate-400 text-white': status === 'soon',
        'bg-flamingo-400 text-white': status === 'wip',
      }"
    >
      {{ status }}
    </div>
  </div>
</template>
