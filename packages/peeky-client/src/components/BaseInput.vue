<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  inheritAttrs: false,

  props: {
    modelValue: {},

    autoFocus: {
      type: Boolean,
      default: false,
    },

    size: {
      type: String,
      default: null,
    },
  },

  emits: [
    'update:modelValue',
  ],

  setup (props) {
    const input = ref<HTMLInputElement>()

    onMounted(() => {
      if (props.autoFocus) {
        input.value?.focus()
      }
    })

    function focus () {
      input.value?.focus()
    }

    const focused = ref(false)

    return {
      input,
      focus,
      focused,
    }
  },
})
</script>

<template>
  <div
    class="flex items-center relative"
    @click="focus()"
  >
    <slot name="before" />

    <input
      ref="input"
      :value="modelValue"
      v-bind="$attrs"
      class="flex-1 w-0 outline-none"
      :class="{
        'px-3 py-2': size === 'md',
      }"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
    >

    <slot name="after" />

    <!-- Focus indicator -->
    <div
      class="absolute bottom-0 left-0 w-full border-b border-purple-300 dark:border-purple-700 transition-all"
      :class="{
        'transform scale-x-0 opacity-0': !focused,
      }"
    />
  </div>
</template>
