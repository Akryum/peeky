<script lang="ts" setup>
import BaseSplitPane from '../BaseSplitPane.vue'
import RunSummaryBar from './RunSummaryBar.vue'
import TestFileAllView from '../test-file/TestFileAllView.vue'
import TestFileOneView from '../test-file/TestFileOneView.vue'
</script>

<template>
  <BaseSplitPane
    :default-split="25"
    :min="5"
    :max="70"
    save-id="peeky-run-test-file-view"
    class="h-full"
  >
    <template #first>
      <div class="h-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        <RunSummaryBar />

        <TestFileOneView
          v-if="$route.query.fileSlug"
        />

        <TestFileAllView
          v-else
        />
      </div>
    </template>

    <template #last>
      <router-view />
    </template>
  </BaseSplitPane>
</template>
