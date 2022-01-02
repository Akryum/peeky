<script lang="ts" setup>
import BaseSplitPane from './BaseSplitPane.vue'
import RunManager from './run/RunManager.vue'
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
      <div class="h-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800 relative">
        <RunManager class="flex-none" />
        <router-view name="sidepane" />
      </div>
    </template>

    <template #last>
      <router-view />
    </template>
  </BaseSplitPane>
</template>
