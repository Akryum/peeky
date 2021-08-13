<script lang="ts" setup>
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { defineProps } from 'vue'
import { ChevronRightIcon, AlertCircleIcon } from '@zhuowenli/vue-feather-icons'
import StatusIcon from '../StatusIcon.vue'

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
  <div class="flex flex-col space-y-12">
    <StatusIcon
      v-if="test.status !== 'error'"
      :status="test.status"
      class="w-24 h-24 flex-none p-4 mx-auto my-auto"
      bg
    />

    <div
      v-else
      class="bg-blush-100 dark:bg-blush-900 text-blush-600 dark:text-blush-300 rounded m-1 divide-y divide-blush-200 dark:divide-blush-800"
    >
      <div class="flex items-baseline space-x-1 p-2">
        <div class="flex-1 font-mono text-sm truncate space-x-1 flex">
          <ChevronRightIcon class="w-4 h-4" />
          <span>{{ test.error.snippet }}</span>
        </div>
        <span
          class="text-blush-300 hover:text-blush-400 cursor-pointer"
          @click="openInEditor({
            id: suite.runTestFile.testFile.id,
            line: test.error.line,
            col: test.error.col,
          })"
        >
          {{ suite.runTestFile.testFile.relativePath }}:{{ test.error.line }}:{{ test.error.col }}
        </span>
      </div>

      <div class="p-2 font-semibold flex items-center space-x-2">
        <AlertCircleIcon class="w-6 h-6" />
        <span>{{ test.error.message }}</span>
      </div>

      <div class="p-2 font-mono text-sm">
        {{ test.error.stack }}
      </div>
    </div>
  </div>
</template>
