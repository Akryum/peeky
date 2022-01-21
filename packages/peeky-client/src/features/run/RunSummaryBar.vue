<script lang="ts" setup>
import type { NexusGenFieldTypes } from '@peeky/server/types'
import { useQuery, useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'

const runStatsFragment = gql`fragment runStats on Run {
  testCount
  inProgressTestCount: testCount (status: in_progress)
  successTestCount: testCount (status: success)
  errorTestCount: testCount (status: error)
  skippedTestCount: testCount (status: skipped)
  todoTestCount: testCount (status: todo)
}`

const props = defineProps<{
  run: NexusGenFieldTypes['Run']
}>()

const { result, refetch } = useQuery<{
  run: {
    id: string
    testCount: number
    successTestCount: number
    errorTestCount: number
    skippedTestCount: number
    todoTestCount: number
  }
}>(gql`query runStats ($runId: ID!) {
  run (id: $runId) {
    id
    ...runStats
  }
}
${runStatsFragment}`, () => ({
  runId: props.run.id,
}))
const runStats = computed(() => result.value?.run)

useSubscription(gql`subscription testUpdatedInRunSummary ($runId: ID!) {
  runStatsUpdated (runId: $runId) {
    id
    ...runStats
  }
}
${runStatsFragment}`, () => ({
  runId: props.run.id,
}))

const kinds = [
  { field: 'errorTestCount', label: 'Error', css: 'bg-red-400 dark:bg-red-600' },
  { field: 'successTestCount', label: 'Success', css: 'bg-green-500' },
  { field: 'todoTestCount', label: 'Todo', css: 'bg-yellow-400 dark:bg-yellow-600' },
  { field: 'skippedTestCount', label: 'Skipped', css: 'bg-gray-200 dark:bg-gray-800' },
]
</script>

<template>
  <div class="flex-none flex items-center space-x-2 h-10">
    <template v-if="runStats">
      <div class="w-full h-full relative mx-3 flex items-center">
        <div class="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-900">
          <div
            v-for="kind of kinds"
            :key="kind.field"
            class="h-full"
            :class="kind.css"
            :style="{
              width: (runStats[kind.field] / runStats.testCount * 100) + '%',
            }"
          />
        </div>

        <div class="absolute top-0 left-0 w-full h-full flex">
          <VTooltip
            v-for="kind of kinds"
            :key="kind.field"
            class="h-full"
            :style="{
              width: (runStats[kind.field] / runStats.testCount * 100) + '%',
            }"
          >
            <div class="w-full h-full" />

            <template #popper>
              <div class="flex items-center space-x-4">
                <div
                  class="w-6 h-2 rounded-full"
                  :class="kind.css"
                />
                <div>
                  <b>{{ kind.label }} {{ runStats[kind.field] }}</b> / {{ runStats.testCount }} test{{ runStats.testCount > 1 ? 's' : '' }}
                </div>
              </div>
            </template>
          </VTooltip>
        </div>
      </div>
    </template>
  </div>
</template>
