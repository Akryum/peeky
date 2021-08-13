<script lang="ts" setup>
defineProps({
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
})
</script>

<template>
  <span
    v-if="duration != null"
    class="text-black dark:text-white opacity-40"
    :class="{
      '!text-carrot-500': duration > big && duration <= huge,
      '!text-tomato-500': duration > huge,
    }"
  >
    {{ duration }}ms
  </span>
</template>
