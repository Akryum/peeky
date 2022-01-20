<script lang="ts" setup>
import BaseSplitPane from '../BaseSplitPane.vue'
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
      <TestFileOneView
        v-if="$route.query.fileSlug"
      />

      <TestFileAllView
        v-else
      />
    </template>

    <template #last>
      <router-view />
    </template>
  </BaseSplitPane>
</template>
