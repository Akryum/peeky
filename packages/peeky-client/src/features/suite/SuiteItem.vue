<script lang="ts">
import gql from 'graphql-tag'
import type { NexusGenFieldTypes } from '@peeky/server/types'

export const testSuiteItemFragment = gql`fragment testSuiteItem on TestSuite {
  id
  slug
  title
  status
  duration
  runTestFile {
    id
    testFile {
      id
      relativePath
    }
  }
  childCount
}`

export type TestSuiteItem = Pick<NexusGenFieldTypes['TestSuite'],
'id' |
'slug' |
'title' |
'status' |
'duration' |
'runTestFile' |
'children' |
'childCount'>
</script>

<script lang="ts" setup>
import TestItem from '../test/TestItem.vue'
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
import { PropType } from 'vue'

const props = defineProps({
  suite: {
    type: Object as PropType<TestSuiteItem>,
    required: true,
  },

  run: {
    type: Object as PropType<NexusGenFieldTypes['Run']>,
    required: true,
  },

  search: {
    type: Object as PropType<{
      searchReg: RegExp | null
      filterFailed: boolean
    }>,
    default: null,
  },

  depth: {
    type: Number,
    required: true,
  },
})

const MAX_RENDER = 100
</script>

<template>
  <div>
    <template v-if="depth >= 0">
      <div
        class="flex items-center space-x-2 h-8 px-3"
        :style="{
          paddingLeft: `${depth * 12 + 6}px`,
        }"
      >
        <StatusIcon
          :status="suite.status"
          class="w-4 h-4 flex-none"
        />
        <span
          class="flex-1 truncate py-1"
          :class="{
            'opacity-60': suite.status === 'skipped',
          }"
        >
          {{ suite.title }}
        </span>
        <Duration
          :duration="suite.duration"
          class="flex-none"
        />
      </div>
    </template>

    <div>
      <template
        v-for="child of suite.children.slice(0, MAX_RENDER)"
        :key="child.id"
      >
        <SuiteItem
          v-if="child.__typename === 'TestSuite'"
          :suite="child"
          :run="run"
          :search="search"
          :depth="depth + 1"
        />
        <TestItem
          v-else
          :test="child"
          :suite="suite"
          :depth="depth + 1"
        />
      </template>

      <div
        v-if="suite.children.length > MAX_RENDER"
        class="flex items-center space-x-2 h-8 px-3 opacity-50 italic"
        :style="{
          paddingLeft: `${(depth + 1) * 12 + 6}px`,
        }"
      >
        {{ suite.childCount - MAX_RENDER }} more...
      </div>
    </div>
  </div>
</template>
