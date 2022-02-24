<script lang="ts" setup>
import { computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { getIframeHtml } from '../../util/preview'

import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from '@zhuowenli/vue-feather-icons'
import BaseButton from '../BaseButton.vue'
import CodeEditor from '../editor/CodeEditor.vue'
import DiffEditor from '../editor/DiffEditor.vue'
import BaseSplitPane from '../BaseSplitPane.vue'

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

  runId: {
    type: String,
    required: true,
  },
})

defineEmits(['previous', 'next'])

const { mutate: openInEditor } = useMutation(gql`
mutation openInEditor ($id: ID!, $line: Int!, $col: Int!) {
  openTestFileInEditor (id: $id, line: $line, col: $col)
}
`)

const { mutate: updateSnapshot } = useMutation(gql`
mutation updateSnapshot ($id: ID!) {
  updateSnapshot (input: { id: $id }) {
    id
    failed
    updated
  }
}
`, {
  update: (cache, { data: { updateSnapshot: snapshot } }) => {
    // Update test
    {
      const select = {
        fragment: gql`fragment updateSnapshotCacheTest on Test {
          id
          failedSnapshotCount
        }`,
        id: `Test:${props.test.id}`,
      }
      const data: any = cache.readFragment(select)
      if (data) {
        cache.writeFragment({
          ...select,
          data: {
            ...data,
            failedSnapshotCount: data.failedSnapshotCount - 1,
          },
        })
      }
    }

    // Update run count
    {
      const select = {
        fragment: gql`fragment updateSnapshotCacheRun on Run {
          id
          failedSnapshotCount
        }`,
        id: `Run:${props.runId}`,
      }
      const data: any = cache.readFragment(select)
      if (data) {
        cache.writeFragment({
          ...select,
          data: {
            ...data,
            failedSnapshotCount: data.failedSnapshotCount - 1,
          },
        })
      }
    }

    // Update lists
    {
      const select = {
        fragment: gql`fragment updateSnapshotCacheRunLists on Run {
          id
          failedSnapshots {
            id
            title
            failed
          }
          passedSnapshots {
            id
            title
            failed
          }
        }`,
        id: `Run:${props.runId}`,
      }
      const data: any = cache.readFragment(select)
      if (data) {
        cache.writeFragment({
          ...select,
          data: {
            ...data,
            failedSnapshots: data.failedSnapshots.filter((s: any) => s.id !== props.snapshot.id),
            passedSnapshots: [
              ...data.passedSnapshots,
              data.failedSnapshots.find((s: any) => s.id === props.snapshot.id),
            ],
          },
        })
      }
    }
  },
})

const isHtml = computed(() => props.snapshot.content.trim().startsWith('<'))
const isEnvDom = computed(() => !!props.test.envResult?.html)
const showPreview = computed(() => isHtml.value && isEnvDom.value)
</script>

<template>
  <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
    <div class="flex items-center space-x-2 px-4 h-10">
      <button
        v-if="snapshot.failed"
        class="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer px-2 py-1"
        @click="openInEditor({
          id: suite.runTestFile.testFile.id,
          line: snapshot.line,
          col: snapshot.col,
        })"
      >
        Mismatch at <span class="font-mono text-sm">{{ suite?.runTestFile.testFile.relativePath }}:{{ snapshot.line }}:{{ snapshot.col }}</span>
      </button>

      <div
        v-else
        class="text-green-500"
      >
        Snapshot matched
      </div>

      <div class="flex-1" />

      <BaseButton
        v-if="snapshot.failed && $route.params.runId === 'last-run'"
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

    <BaseSplitPane
      :disabled="!showPreview"
      :default-split="60"
      :min="20"
      :max="80"
      save-id="peeky-snapshot-view"
      orientation="portrait"
      class="flex-1"
    >
      <template #first>
        <DiffEditor
          v-if="snapshot.failed"
          :actual="snapshot.newContent"
          :expected="snapshot.content"
          class="h-full"
        />
        <CodeEditor
          v-else
          :code="snapshot.content"
          class="h-full"
        />
      </template>

      <template #last>
        <div
          v-if="showPreview"
          class="h-full flex items-stretch divide-x divide-gray-100 dark:divide-gray-900"
        >
          <iframe
            :srcdoc="getIframeHtml(snapshot.content, props.test.previewImports)"
            class="flex-1 min-w-0 min-h-0 h-full"
          />
          <iframe
            v-if="snapshot.failed"
            :srcdoc="getIframeHtml(snapshot.newContent, props.test.previewImports)"
            class="flex-1 min-w-0 min-h-0 h-full"
          />
          <div class="flex-none w-[30px]" />
        </div>
      </template>
    </BaseSplitPane>
  </div>
</template>
