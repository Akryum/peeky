<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'

export default defineComponent({
  props: {
    orientation: {
      type: String,
      default: 'landscape',
      validator: value => ['landscape', 'portrait'].includes(value),
    },

    defaultSplit: {
      type: Number,
      default: 50,
    },

    min: {
      type: Number,
      default: 20,
    },

    max: {
      type: Number,
      default: 80,
    },

    draggerOffset: {
      type: String,
      default: 'center',
      validator: value => ['before', 'center', 'after'].includes(value),
    },

    saveId: {
      type: String,
      default: null,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  setup (props) {
    const split = ref(props.defaultSplit)

    if (props.saveId) {
      const storageKey = `split-pane-${props.saveId}`

      const savedValue = localStorage.getItem(storageKey)
      if (savedValue != null) {
        let parsedValue
        try {
          parsedValue = JSON.parse(savedValue)
        } catch (e) {
          console.error(e)
        }

        if (typeof parsedValue === 'number') {
          split.value = parsedValue
        }
      }

      watch(split, value => {
        localStorage.setItem(storageKey, JSON.stringify(value))
      })
    }

    const boundSplit = computed(() => {
      if (split.value < props.min) {
        return props.min
      } else if (split.value > props.max) {
        return props.max
      } else {
        return split.value
      }
    })

    const leftStyle = computed(() => (props.disabled
      ? {
        flex: 'auto 1 1',
      }
      : {
        [props.orientation === 'landscape' ? 'width' : 'height']: `${boundSplit.value}%`,
      }))

    const rightStyle = computed(() => (props.disabled
      ? {
        display: 'none',
      }
      : {
        [props.orientation === 'landscape' ? 'width' : 'height']: `${100 - boundSplit.value}%`,
      }))

    const dragging = ref(false)
    let startPosition = 0
    let startSplit = 0
    const el = ref(null)

    function dragStart (e) {
      dragging.value = true
      startPosition = props.orientation === 'landscape' ? e.pageX : e.pageY
      startSplit = boundSplit.value
    }

    function dragMove (e) {
      if (dragging.value) {
        let position
        let totalSize
        if (props.orientation === 'landscape') {
          position = e.pageX
          totalSize = el.value.offsetWidth
        } else {
          position = e.pageY
          totalSize = el.value.offsetHeight
        }
        const dPosition = position - startPosition
        split.value = startSplit + ~~(dPosition / totalSize * 200) / 2
      }
    }

    function dragEnd () {
      dragging.value = false
    }

    return {
      el,
      dragging,
      dragStart,
      dragMove,
      dragEnd,
      leftStyle,
      rightStyle,
    }
  },
})
</script>

<template>
  <div
    ref="el"
    class="base-split-pane flex h-full"
    :class="{
      'flex-col meow': orientation === 'portrait',
      'cursor-ew-resize': dragging && orientation === 'landscape',
      'cursor-ns-resize': dragging && orientation === 'portrait',
      [orientation]: true
    }"
    @mousemove="dragMove"
    @mouseup="dragEnd"
    @mouseleave="dragEnd"
  >
    <div
      class="relative top-0 left-0"
      :class="{
        'pointer-events-none': dragging,
        'border-r border-gray-100 dark:border-gray-800': orientation === 'landscape'
      }"
      :style="leftStyle"
    >
      <slot name="first" />

      <div
        v-if="!disabled"
        class="dragger absolute z-100 hover:bg-primary-500 hover:bg-opacity-25 transition-colors duration-150 delay-150"
        :class="{
          'top-0 bottom-0 cursor-ew-resize': orientation === 'landscape',
          'left-0 right-0 cursor-ns-resize': orientation === 'portrait',
          [`dragger-offset-${draggerOffset}`]: true
        }"
        @mousedown.prevent="dragStart"
      />
    </div>
    <div
      class="relative bottom-0 right-0"
      :class="{
        'pointer-events-none': dragging,
        'border-t border-gray-100 dark:border-gray-800': orientation === 'portrait'
      }"
      :style="rightStyle"
    >
      <slot name="last" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.dragger {
  .landscape > div > & {
    width: 10px;
  }

  .portrait > div > & {
    height: 10px;
  }

  &.dragger-offset-before {
    .landscape > div > & {
      right: 0;
    }

    .portrait > div > & {
      bottom: 0;
    }
  }

  &.dragger-offset-center {
    .landscape > div > & {
      right: -5px;
    }

    .portrait > div > & {
      bottom: -5px;
    }
  }

  &.dragger-offset-after {
    .landscape > div > & {
      right: -10px;
    }

    .portrait > div > & {
      bottom: -10px;
    }
  }
}
</style>
