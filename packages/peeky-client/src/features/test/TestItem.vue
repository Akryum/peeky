<script lang="ts">
import gql from 'graphql-tag'

export const testItemFragment = gql`
fragment testItem on Test {
  id
  slug
  title
  status
  duration
  error {
    message
    snippet
    line
    col
  }
}
`
</script>

<script lang="ts" setup>
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
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

  depth: {
    type: Number,
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
  <router-link
    :to="{
      name: $route.name.startsWith('test') ? $route.name : 'test',
      params: {
        suiteSlug: suite.slug,
        testSlug: test.slug,
      },
      query: {
        ...$route.query,
      },
    }"
    class="flex items-center space-x-2 h-8 px-3 hover:bg-gray-50 dark:hover:bg-gray-900"
    :class="{
      'active-colors': test.slug === $route.params.testSlug && $route.params.suiteSlug === suite.slug,
    }"
    :style="{
      paddingLeft: `${depth * 12 + 6}px`,
    }"
  >
    <StatusIcon
      :status="test.status"
      class="w-4 h-4 flex-none"
    />
    <span class="flex-1 truncate py-1">
      {{ test.title }}
    </span>
    <Duration :duration="test.duration" />
  </router-link>

  <div
    v-if="test.status === 'error'"
    class="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 m-1 rounded relative text-sm"
  >
    <div class="absolute left-10 -top-1 w-3 h-3 rotate-45 bg-red-100 dark:bg-red-900" />

    <div class="relative">
      <div class="flex items-baseline space-x-1 p-2">
        <div class="flex-1 font-mono text-sm truncate">
          <div v-if="test.error.snippet">
            {{ test.error.snippet }}
          </div>
          <div
            v-else
            class="font-semibold truncate"
            v-html="test.error.message"
          />
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
        v-if="test.error.snippet"
        class="p-2 font-semibold border-t border-red-200 dark:border-red-800 truncate"
        v-html="test.error.message"
      />
    </div>
  </div>
</template>
