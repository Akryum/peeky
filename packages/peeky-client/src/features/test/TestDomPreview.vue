<script lang="ts" setup>
import { getIframeHtml } from '../../util/preview'

import BaseSplitPane from '../BaseSplitPane.vue'
import CodeEditor from '../editor/CodeEditor.vue'

const props = defineProps({
  test: {
    type: Object,
    required: true,
  },

  suite: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <BaseSplitPane
    :default-split="50"
    :min="20"
    :max="80"
    save-id="peeky-test-dom-preview"
    class="h-full"
  >
    <template #first>
      <CodeEditor
        :code="props.test.envResult?.html || ''"
        class="h-full"
      />
    </template>
    <template #last>
      <iframe
        class="min-w-0 w-full min-h-0 h-full"
        :srcdoc="getIframeHtml(props.test.envResult?.html ?? '', props.test.previewImports)"
      />
    </template>
  </BaseSplitPane>
</template>
