<script lang="ts">
import gql from 'graphql-tag'

export const testItemFragment = gql`
fragment testItem on Test {
  id
  title
  status
  duration
  error {
    message
    stack
    snippet
    line
    col
  }
}
`
</script>

<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { defineProps } from 'vue'
import { useMutation } from '@vue/apollo-composable'

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
    <span class="flex-1 truncate py-1">
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
    class="bg-red-50 text-red-600 m-1 rounded relative text-sm"
  >
    <div class="absolute left-10 -top-1 w-3 h-3 transform rotate-45 bg-red-100" />

    <div class="relative">
      <div class="font-mono text-sm truncate px-2 pt-2 pb-1 bg-red-100 rounded-t">
        {{ test.error.snippet }}
      </div>

      <div class="flex items-center space-x-1 px-2">
        <span class="flex-1 truncate py-1 font-semibold">
          {{ test.error.message }}
        </span>
        <span
          class="text-red-300 hover:text-red-400 cursor-pointer"
          @click="openInEditor({
            id: suite.runTestFile.testFile.id,
            line: test.error.line,
            col: test.error.col,
          })"
        >
          {{ suite.runTestFile.testFile.relativePath }}:{{ test.error.line }}:{{ test.error.col }}
        </span>
      </div>
    </div>
  </div>
</template>
