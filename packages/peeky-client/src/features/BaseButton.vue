<script lang="ts">
import { computed, defineComponent } from 'vue'

const colors = {
  gray: [
    'hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100',
    'bg-gray-300 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  ],
  flamingo: [
    'hover:bg-flamingo-200 hover:text-flamingo-900 dark:hover:bg-flamingo-700 dark:hover:text-flamingo-100',
    'bg-flamingo-300 text-flamingo-900 dark:bg-flamingo-800 dark:text-flamingo-200',
  ],
  blush: [
    'hover:bg-blush-200 hover:text-blush-900 dark:hover:bg-blush-700 dark:hover:text-blush-100',
    'bg-blush-300 text-blush-900 bg-blush-800 text-blush-200',
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
      default: 'flamingo',
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
    class="flex items-center justify-center rounded text-center focus:outline-none focus:ring-1 ring-flamingo-300 dark:ring-flamingo-700"
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
