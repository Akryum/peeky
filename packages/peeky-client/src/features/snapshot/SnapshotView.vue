<script lang="ts" setup>
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from '@zhuowenli/vue-feather-icons'
import BaseButton from '../BaseButton.vue'
import CodeEditor from '../editor/CodeEditor.vue'
import DiffEditor from '../editor/DiffEditor.vue'

const props = defineProps({
  snapshot: {
    type: Object,
    required: true,
  },

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

const { mutate: updateSnapshot } = useMutation(gql`
mutation updateSnapshot ($id: ID!) {
  updateSnapshot (input: { id: $id }) {
    id
    updated
  }
}
`, {
  update: (cache, { data: { updateSnapshot: snapshot } }) => {
    const select = {
      fragment: gql`fragment updateSnapshotCacheTest on Test {
        id
        failedSnapshotCount
      }`,
      id: `Test:${props.test.id}`,
    }
    const data: any = cache.readFragment(select)
    cache.writeFragment({
      ...select,
      data: {
        ...data,
        failedSnapshotCount: data.failedSnapshotCount - 1,
      },
    })
  },
})
</script>

<template>
  <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
    <div class="flex items-center space-x-2 px-4 h-10">
      <button
        v-if="snapshot.newContent && !snapshot.updated"
        class="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer px-2 py-1"
        @click="openInEditor({
          id: suite.runTestFile.testFile.id,
          line: snapshot.line,
          col: snapshot.col,
        })"
      >
        Mismatch at <span class="font-mono text-sm">{{ suite?.runTestFile.testFile.relativePath }}:{{ snapshot.line }}:{{ snapshot.col }}</span>
      </button>

      <div class="flex-1" />

      <BaseButton
        v-if="snapshot.newContent && !snapshot.updated && $route.params.runId === 'last-run'"
        class="px-2 h-8"
        @click="updateSnapshot({ id: snapshot.id })"
      >
        <SaveIcon class="w-4 h-4 mr-1" />
        <span>Update snapshot</span>
      </BaseButton>

      <BaseButton
        color="gray"
        flat
        class="p-2"
        @click="$emit('previous')"
      >
        <ChevronLeftIcon class="w-4 h-4" />
      </BaseButton>

      <BaseButton
        color="gray"
        flat
        class="p-2"
        @click="$emit('next')"
      >
        <ChevronRightIcon class="w-4 h-4" />
      </BaseButton>
    </div>

    <DiffEditor
      v-if="snapshot.newContent && !snapshot.updated"
      :actual="snapshot.newContent"
      :expected="snapshot.content"
      class="flex-1"
    />
    <CodeEditor
      v-else
      :code="snapshot.content"
      class="flex-1"
    />
  </div>
</template>
