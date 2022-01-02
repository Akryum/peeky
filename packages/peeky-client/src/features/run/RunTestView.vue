<script lang="ts" setup>
import TestFileAllView from '../test-file/TestFileAllView.vue'
import TestFileOneView from '../test-file/TestFileOneView.vue'
</script>

<template>
  <TestFileOneView
    v-if="$route.query.fileSlug"
  />

  <TestFileAllView
    v-else
  />
</template>
