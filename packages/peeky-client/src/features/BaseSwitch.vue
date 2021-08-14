<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    modelValue: {},

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  emits: [
    'update:modelValue',
  ],
})
</script>

<template>
  <div
    class="select-none"
    :class="{
      checked: modelValue,
      'opacity-50': disabled,
    }"
  >
    <div class="flex items-center relative">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="opacity-0 absolute inset-0 w-full h-full z-10"
        :class="[
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ]"
        @input="$emit('update:modelValue', $event.target.checked)"
      >

      <div
        class="switch-box relative flex-none block rounded-full border"
        :class="{
          'bg-gray-300 border-gray-400 dark:bg-gray-400 dark:border-gray-500': !modelValue,
          'bg-primary-600 border-primary-600 dark:bg-primary-400 dark:border-primary-400': modelValue,
        }"
      >
        <div class="dot bg-white rounded-full absolute" />
      </div>
      <span
        v-if="$slots.default"
        class="ml-3"
      >
        <slot />
      </span>
    </div>
  </div>
</template>

<style scoped>
.switch-box {
  width: 22px;
  height: 12px;
  transition: background .15s, border .15s;
}

.dot {
  width: 10px;
  height: 10px;
  left: 0px;
  top: 0px;
  transition: left .15s, border .15s;
  box-sizing: border-box;
  .checked & {
    left: 10px;
  }
}
</style>
