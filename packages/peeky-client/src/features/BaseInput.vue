<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'

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

  setup (props, { attrs }) {
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

    const filteredAttrs = computed(() => {
      const { class: _, ...other } = attrs
      return other
    })

    return {
      input,
      focus,
      focused,
      filteredAttrs,
    }
  },
})
</script>

<template>
  <div
    class="flex items-center relative"
    :class="$attrs.class"
    @click="focus()"
  >
    <slot name="before" />

    <input
      ref="input"
      :value="modelValue"
      v-bind="filteredAttrs"
      class="flex-1 w-0 h-full outline-none bg-transparent"
      :class="{
        'p-2': size === 'md',
      }"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
    >

    <slot name="after" />

    <!-- Focus indicator -->
    <div
      class="absolute bottom-0 left-0 w-full border-b border-primary-300 dark:border-primary-700 transition-all"
      :class="{
        'scale-x-0 opacity-0': !focused,
      }"
    />
  </div>
</template>
