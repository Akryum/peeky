<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { defineProps } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const props = defineProps({
  test: {
    type: Object,
    required: true,
  },

  run: {
    type: Object,
    required: true,
  },
})

const { mutate: openInEditor } = useMutation(gql`
mutation openInEditor ($id: ID!, $line: Int!, $col: Int!) {
  openTestFileInEditor (id: $id, line: $line, col: $col)
}
`)
</script>

<template>
  <div class="flex items-center space-x-2 h-8 px-3">
    <StatusIcon
      :status="test.status"
      class="w-4 h-4 flex-none"
    />
    <span class="flex-1 truncate h-full flex items-center">
      {{ test.title }}
    </span>
    <span
      v-if="test.duration != null"
      class="text-gray-300 dark:text-gray-700"
    >
      {{ test.duration }}ms
    </span>
  </div>

  <div
    v-if="test.status === 'error'"
    class="bg-red-50 text-red-600 px-2 py-1 m-1 rounded relative text-sm"
  >
    <div class="flex items-center space-x-1">
      <span class="flex-1 truncate py-1">
        {{ test.error.message }}
      </span>
      <span
        class="text-red-300 hover:text-red-400 cursor-pointer"
        @click="openInEditor({
          id: run.runTestFile.testFile.id,
          line: test.error.line,
          col: test.error.col,
        })"
      >
        {{ run.runTestFile.testFile.relativePath }}:{{ test.error.line }}:{{ test.error.col }}
      </span>
    </div>

    <div class="absolute left-10 -top-1 w-3 h-3 transform rotate-45 bg-red-50" />
  </div>
</template>
