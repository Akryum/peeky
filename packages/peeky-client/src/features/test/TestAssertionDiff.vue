<script lang="ts" setup>
import * as monaco from 'monaco-editor'
import { onMounted, ref, watch } from 'vue-demi'
import { onResize } from '../../util/resize'
import '../../util/monaco'
import { useSettings } from '../settings'

const props = defineProps({
  expected: {
    type: String,
    required: true,
  },

  actual: {
    type: String,
    required: true,
  },
})

const el = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneDiffEditor

onMounted(() => {
  if (!el.value) return
  editor = monaco.editor.createDiffEditor(el.value, {
    readOnly: true,
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
  })
  updateEditorModel()
  updateEditorTheme()
})

/* Model */

watch(() => [props.expected, props.actual], () => {
  updateEditorModel()
})

function updateEditorModel () {
  if (editor) {
    editor.setModel({
      original: monaco.editor.createModel(props.expected, 'javascript'),
      modified: monaco.editor.createModel(props.actual, 'javascript'),
    })
  }
}

/* Theme */

const { settings } = useSettings()

watch(() => settings.value?.darkMode, () => {
  updateEditorTheme()
})

function updateEditorTheme () {
  if (!editor) return
  editor.updateOptions({
    // @ts-ignore
    theme: settings.value?.darkMode ? 'peeky-dark' : 'peeky-light',
  })
}

/* Resize */

onResize(el, () => {
  if (editor) {
    editor.layout()
  }
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex-none flex justify-between px-1 mb-1">
      <div class="text-shamrock-600 dark:text-shamrock-500">
        Expected
      </div>
      <div class="text-blush-500 mr-8">
        Actual
      </div>
    </div>

    <div
      ref="el"
      class="flex-1"
    />
  </div>
</template>
