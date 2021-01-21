<script lang="ts" setup>
import RunManager from './RunManager.vue'
import TestFiles from './TestFiles.vue'
</script>

<template>
  <div class="h-screen flex items-stretch divide-x divide-gray-100 dark:divide-gray-900">
    <div class="flex-shrink w-1/5 flex flex-col divide-y divide-gray-100 dark:divide-gray-900 relative">
      <RunManager />
      <TestFiles class="flex-1" />
    </div>

    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
