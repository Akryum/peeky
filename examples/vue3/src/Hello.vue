<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps({
  count: {
    type: Number,
  },
})

const multiply = ref(2)

const result = computed(() => props.count * multiply.value)
</script>

<template>
  <pre>{{ count }} x {{ multiply }} = {{ result }}</pre>
  <button @click="multiply++">
    More
  </button>
</template>
