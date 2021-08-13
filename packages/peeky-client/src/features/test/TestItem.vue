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
      name: 'test',
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
      active: test.slug === $route.params.testSlug && $route.params.suiteSlug === suite.slug,
    }"
    :style="{
      paddingLeft: `${depth * 16}px`,
    }"
  >
    <StatusIcon
      :status="test.status"
      class="w-4 h-4 flex-none"
    />
    <span class="flex-1 truncate py-1">
      {{ test.title }}
    </span>
    <span
      v-if="test.duration != null"
      class="text-black dark:text-white opacity-40"
    >
      {{ test.duration }}ms
    </span>
  </router-link>

  <div
    v-if="test.status === 'error'"
    class="bg-blush-100 dark:bg-blush-900 text-blush-600 dark:text-blush-300 m-1 rounded relative text-sm"
  >
    <div class="absolute left-10 -top-1 w-3 h-3 transform rotate-45 bg-blush-100 dark:bg-blush-900" />

    <div class="relative">
      <div class="flex items-baseline space-x-1 p-2">
        <div class="flex-1 font-mono text-sm truncate">
          {{ test.error.snippet }}
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

      <div class="p-2 font-semibold border-t border-blush-200 dark:border-blush-800">
        {{ test.error.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.active {
  @apply bg-flamingo-50 text-flamingo-800 dark:bg-flamingo-900 dark:text-flamingo-300;

  .path {
    @apply opacity-100;
  }
}
</style>
