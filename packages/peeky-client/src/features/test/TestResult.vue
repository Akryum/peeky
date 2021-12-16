<script lang="ts">
export const errorFragment = gql`
fragment testResultError on TestError {
  message
  stack
  snippet
  line
  col
  expected
  actual
}
`
</script>

<script lang="ts" setup>
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed, defineProps, ref } from 'vue'
import { ChevronRightIcon } from '@zhuowenli/vue-feather-icons'
import StatusIcon from '../StatusIcon.vue'
import TestAssertionDiff from './TestAssertionDiff.vue'
import BaseButton from '../BaseButton.vue'

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

const stackHtml = computed(() => props.test.error.stack.replace(/((\w:\\|\/)([A-Za-zÀ-ÖØ-öø-ÿ\d-_. ]+(\\|\/))+[A-Za-zÀ-ÖØ-öø-ÿ\d-_. ]+\.[A-Za-zÀ-ÖØ-öø-ÿ\d]+):(\d+):(\d+)/g,
  '<a class="cursor-pointer hover:text-red-400" data-file="$1" data-line="$5" data-col="$6">$&</a>'))

const { mutate: openFileInEditor } = useMutation(gql`
mutation openFileInEditor ($path: String!, $line: Int!, $col: Int!) {
  openFileInEditor (path: $path, line: $line, col: $col)
}
`)

function onStackClick (event: MouseEvent) {
  const link = event.target as HTMLLinkElement
  if (!link.attributes.getNamedItem('data-file')?.value) { return }

  openFileInEditor({
    path: link.attributes.getNamedItem('data-file')?.value,
    line: Number(link.attributes.getNamedItem('data-line')?.value),
    col: Number(link.attributes.getNamedItem('data-col')?.value),
  })
}

const showFullStack = ref(false)

const diffShown = computed(() => props.test?.error?.actual && props.test?.error?.expected)
</script>

<template>
  <div class="flex flex-col">
    <StatusIcon
      v-if="test.status !== 'error'"
      :status="test.status"
      class="flex-none mx-auto my-auto"
      icon-class="w-24 h-24 p-4"
      bg
    />

    <template v-else>
      <div class="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded m-1 divide-y divide-red-200 dark:divide-red-800">
        <div class="flex items-baseline space-x-1 p-2">
          <div class="flex-1 font-mono text-sm truncate space-x-1 flex">
            <ChevronRightIcon class="w-4 h-4" />
            <span>{{ test.error.snippet }}</span>
          </div>
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

        <div
          class="p-2 font-mono text-sm overflow-hidden whitespace-pre-wrap"
          :class="{
            'max-h-8': diffShown && !showFullStack,
          }"
          @click="onStackClick"
          v-html="stackHtml"
        />

        <div v-if="diffShown">
          <BaseButton
            color="red"
            flat
            class="px-2 py-1 w-full"
            @click="showFullStack = !showFullStack"
          >
            <template v-if="showFullStack">
              Hide full stack trace
            </template>
            <template v-else>
              Show full stack trace
            </template>
          </BaseButton>
        </div>
      </div>

      <TestAssertionDiff
        v-if="diffShown"
        :actual="test.error.actual"
        :expected="test.error.expected"
        class="flex-1 m-1 min-h-64"
      />
    </template>
  </div>
</template>
