<script lang="ts">
import { computed, defineComponent } from 'vue'

const colors = {
  gray: [
    'hover:bg-gray-300 hover:text-black dark:hover:bg-gray-700 dark:hover:text-gray-100',
    'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  ],
  primary: [
    'hover:bg-primary-200 hover:text-primary-900 dark:hover:bg-primary-700 dark:hover:text-primary-100',
    'bg-primary-300 text-primary-900 dark:bg-primary-800 dark:text-primary-200',
  ],
  red: [
    'hover:bg-red-200 hover:text-red-900 dark:hover:bg-red-700 dark:hover:text-red-100',
    'bg-red-300 text-red-900 bg-red-800 text-red-200',
  ],
}

export default defineComponent({
  props: {
    size: {
      type: String,
      default: null,
    },

    color: {
      type: String,
      default: 'primary',
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

  setup (props) {
    return {
      colors: computed(() => {
        const color = props.color as keyof typeof colors
        if (!colors[color]) {
          console.warn(`Invalid button color: ${color}`)
          return colors.gray
        }
        return colors[color]
      }),
    }
  },
})
</script>

<template>
  <button
    class="flex items-center justify-center rounded text-center focus:outline-none focus:ring-1 ring-primary-300 dark:ring-primary-700"
    :disabled="disabled"
    :class="[
      colors[0],
      {
        [colors[1]]: !flat,
        'opacity-75 pointer-events-none': disabled,
      },
    ]"
  >
    <slot />
  </button>
</template>
