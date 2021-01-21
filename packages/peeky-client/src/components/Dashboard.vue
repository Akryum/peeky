<script lang="ts" setup>
import BaseSplitPane from './BaseSplitPane.vue'
import RunManager from './RunManager.vue'
import TestFiles from './TestFiles.vue'
</script>

<template>
  <BaseSplitPane
    :default-split="20"
    :min="5"
    :max="70"
    save-id="peeky-dashboard"
    class="h-screen"
  >
    <template #first>
      <div class="h-full flex flex-col divide-y divide-gray-100 dark:divide-gray-900 relative">
        <RunManager class="flex-none" />
        <TestFiles class="flex-1 h-0" />
      </div>
    </template>

    <template #last>
      <router-view />
    </template>
  </BaseSplitPane>
</template>
