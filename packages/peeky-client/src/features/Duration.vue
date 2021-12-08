<script lang="ts" setup>
import { computed } from 'vue'
import { formatDuration } from '@peeky/utils/dist/format'

const props = defineProps({
  duration: {
    type: Number,
    default: null,
  },

  big: {
    type: Number,
    default: 10,
  },

  huge: {
    type: Number,
    default: 300,
  },

  noColors: {
    type: Boolean,
    default: false,
  },
})

const formatted = computed(() => formatDuration(props.duration))
</script>

<template>
  <span
    v-if="duration != null"
    class="text-black dark:text-white opacity-40"
    :class="{
      '!text-yellow-500': !noColors && duration > big && duration <= huge,
      '!text-orange-500': !noColors && duration > huge,
    }"
  >
    {{ formatted[0] }}<span class="opacity-70">{{ formatted[1] }}</span>
  </span>
</template>
