<script lang="ts" setup>
import { useQuery, useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const runStatsFragment = gql`fragment runStats on Run {
  testCount
  inProgressTestCount: testCount (status: in_progress)
  successTestCount: testCount (status: success)
  errorTestCount: testCount (status: error)
  skippedTestCount: testCount (status: skipped)
  todoTestCount: testCount (status: todo)
}`

const route = useRoute()

const runId = computed(() => route.params.runId ?? 'last-run')
const hideBar = computed(() => !!route.query.fileSlug)

const { result } = useQuery<{
  run: {
    id: string
    testCount: number
    successTestCount: number
    errorTestCount: number
    skippedTestCount: number
    todoTestCount: number
  }
}>(() => route.params.runId !== 'last-run'
  ? gql`query runStats ($runId: ID!) {
    run (id: $runId) {
      id
      ...runStats
    }
  }
  ${runStatsFragment}`
  : gql`query lastRunStats {
    run: lastRun {
      id
      ...runStats
    }
  }
  ${runStatsFragment}`, () => ({
  runId: route.params.runId !== 'last-run' ? runId.value : undefined,
}))
const runStats = computed(() => result.value?.run ?? {
  id: '',
  testCount: 0,
  successTestCount: 0,
  errorTestCount: 0,
  skippedTestCount: 0,
  todoTestCount: 0,
})

useSubscription(gql`subscription testUpdatedInRunSummary ($runId: ID!) {
  runStatsUpdated (runId: $runId) {
    id
    ...runStats
  }
}
${runStatsFragment}`, () => ({
  runId: runId.value,
}))

const kinds = [
  { field: 'errorTestCount', label: 'Error', css: 'bg-red-400 dark:bg-red-600' },
  { field: 'successTestCount', label: 'Success', css: 'bg-green-500' },
  { field: 'todoTestCount', label: 'Todo', css: 'bg-yellow-400 dark:bg-yellow-600' },
  { field: 'skippedTestCount', label: 'Skipped', css: 'bg-gray-300 dark:bg-gray-700' },
]
</script>

<template>
  <div class="flex-none flex items-center space-x-4 px-3 h-10 bg-gray-50 dark:bg-gray-950 overflow-hidden">
    <div
      v-for="kind of kinds"
      :key="kind.field"
      class="flex items-center space-x-2"
    >
      <div
        class="w-4 h-1 rounded-full"
        :class="kind.css"
      />
      <div class="space-x-1">
        <b>{{ runStats[kind.field] }}</b>
        <span class="opacity-80">{{ kind.label }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="!hideBar"
    class="flex-none flex items-center space-x-2 h-10 bg-gray-50 dark:bg-gray-950"
  >
    <div class="w-full h-full relative mx-3 flex items-center">
      <div class="w-full h-1 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
        <div
          v-for="kind of kinds"
          :key="kind.field"
          class="h-full"
          :class="kind.css"
          :style="{
            width: (runStats[kind.field] / Math.max(runStats.testCount, 1) * 100) + '%',
          }"
        />
      </div>

      <div class="absolute top-0 left-0 w-full h-full flex">
        <VTooltip
          v-for="kind of kinds"
          :key="kind.field"
          placement="bottom"
          class="h-full"
          :style="{
            width: (runStats[kind.field] / Math.max(runStats.testCount, 1) * 100) + '%',
          }"
        >
          <div class="w-full h-full" />

          <template #popper>
            <div class="flex items-center space-x-4">
              <div
                class="w-4 h-1 rounded-full"
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
  </div>
</template>
