<script lang="ts" setup>
import * as monaco from 'monaco-editor'
import { onMounted, ref, watch } from 'vue'
import { onResize } from '../../util/resize'
import '../../util/monaco'
import { useSettings } from '../settings'

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
})

const el = ref<HTMLDivElement>()
let editor: monaco.editor.IEditor

onMounted(() => {
  if (!el.value) return
  editor = monaco.editor.create(el.value, {
    readOnly: true,
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
  })
  updateEditorModel()
  updateEditorTheme()
})

/* Model */

watch(() => [props.code], () => {
  updateEditorModel()
})

function updateEditorModel () {
  if (editor) {
    editor.setModel(monaco.editor.createModel(props.code, props.code.trim().startsWith('<') ? 'html' : 'javascript'))
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
    <div
      ref="el"
      class="flex-1"
    />
  </div>
</template>
