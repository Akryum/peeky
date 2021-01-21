<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    size: {
      type: String,
      default: null,
    },

    color: {
      type: String,
      default: 'purple',
    },

    flat: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },
})
</script>

<template>
  <button
    class="flex items-center justify-center rounded text-center focus:outline-none focus:ring-1 ring-purple-300 dark:ring-purple-700"
    :disabled="disabled"
    :class="[
      `hover:bg-${color}-200 hover:text-${color}-900`,
      {
        [`bg-${color}-300 text-${color}-900`]: !flat,
        'opacity-75 pointer-events-none': disabled,
      },
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
