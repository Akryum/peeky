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

    return {
      input,
      focus,
    }
  },
})
</script>

<template>
  <div
    class="flex items-center focus-within:ring-2"
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
    >

    <slot name="after" />
  </div>
</template>
