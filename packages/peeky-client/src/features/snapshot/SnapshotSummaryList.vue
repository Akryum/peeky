<script lang="ts" setup>import { NexusGenFieldTypes } from '@peeky/server/types'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SnapshotItem from './SnapshotItem.vue'

const runFragment = gql`fragment runSnapshotSummary on Run {
  id
  failedSnapshots {
    ...runSnapshotSummarySnapshot
  }
  passedSnapshots {
    ...runSnapshotSummarySnapshot
  }
  newSnapshots {
    ...runSnapshotSummarySnapshot
  }
}

fragment runSnapshotSummarySnapshot on Snapshot {
  id
  title
  failed
}`

type Run = Pick<NexusGenFieldTypes['Run'], 'id' | 'failedSnapshots' | 'passedSnapshots' | 'newSnapshots'>

const route = useRoute()

const { result, subscribeToMore } = useQuery<{
  run: Run
}>(() => route.params.runId !== 'last-run'
  ? gql`
  query testFileAllView ($runId: ID!) {
    run (id: $runId) {
      ...runSnapshotSummary
    }
  }
  ${runFragment}
`
  : gql`
  query testFileAllViewLastRun {
    run: lastRun {
      ...runSnapshotSummary
    }
  }
  ${runFragment}
`, () => ({
  ...route.params.runId !== 'last-run'
    ? {
      runId: route.params.runId,
    }
    : {},
}), {
  fetchPolicy: 'cache-and-network',
})

// Updated
subscribeToMore({
  document: gql`
  subscription runUpdated {
    runUpdated {
      ...runSnapshotSummary
    }
  }
  ${runFragment}`,
})

const failedSnapshots = computed(() => result.value?.run.failedSnapshots ?? [])
const newSnapshots = computed(() => result.value?.run.newSnapshots ?? [])
const passedSnapshots = computed(() => result.value?.run.passedSnapshots ?? [])
</script>

<template>
  <div
    v-if="failedSnapshots.length"
    class="py-2"
  >
    <div class="text-red-500 flex items-center justify-center space-x-1 pb-1">
      <span>Failed</span>
      <span class="text-xs px-1.5 rounded-full leading-tight border border-current mt-0.5">{{ failedSnapshots.length }}</span>
    </div>
    <SnapshotItem
      v-for="snapshot of failedSnapshots"
      :key="snapshot.id"
      :snapshot="snapshot"
    />
  </div>
  <div
    v-if="newSnapshots.length"
    class="py-2"
  >
    <div class="text-green-500 flex items-center justify-center space-x-1 pb-1">
      <span>New</span>
      <span class="text-xs px-1.5 rounded-full leading-tight border border-current mt-0.5">{{ newSnapshots.length }}</span>
    </div>
    <SnapshotItem
      v-for="snapshot of newSnapshots"
      :key="snapshot.id"
      :snapshot="snapshot"
    />
  </div>
  <div
    v-if="passedSnapshots.length"
    class="py-2"
  >
    <div class="text-green-500 flex items-center justify-center space-x-1 pb-1">
      <span>Passed</span>
      <span class="text-xs px-1.5 rounded-full leading-tight border border-current mt-0.5">{{ passedSnapshots.length }}</span>
    </div>
    <SnapshotItem
      v-for="snapshot of passedSnapshots"
      :key="snapshot.id"
      :snapshot="snapshot"
    />
  </div>
</template>
