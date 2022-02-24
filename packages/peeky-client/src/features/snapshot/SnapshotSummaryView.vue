<script lang="ts" setup>
import { NexusGenFieldTypes } from '@peeky/server/types'
import { useQuery, useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import SnapshotView from './SnapshotView.vue'
import TestViewPlaceholder from '../test/TestViewPlaceholder.vue'

const runFragment = gql`fragment runOneSnapshot on Run {
  id
  snapshot: snapshotById (id: $snapshotId) {
    id
    title
    content
    newContent
    failed
    updated
    line
    col
    test {
      id
      suite {
        id
        runTestFile {
          id
          testFile {
            id
            relativePath
          }
        }
      }
      envResult
      previewImports
    }
  }
  nextSnapshot (id: $snapshotId) {
    id
  }
  previousSnapshot (id: $snapshotId) {
    id
  }
}`

type Run = Pick<NexusGenFieldTypes['Run'], 'id'> & {
  snapshot: NexusGenFieldTypes['Snapshot']
  nextSnapshot: {
    id: string
  }
  previousSnapshot: {
    id: string
  }
}

const route = useRoute()

const { result, refetch } = useQuery<{
  run: Run
}>(() => route.params.runId !== 'last-run'
  ? gql`
  query testFileAllView ($runId: ID!, $snapshotId: ID!) {
    run (id: $runId) {
      ...runOneSnapshot
    }
  }
  ${runFragment}
`
  : gql`
  query testFileAllViewLastRun ($snapshotId: ID!) {
    run: lastRun {
      ...runOneSnapshot
    }
  }
  ${runFragment}
`, () => ({
  ...route.params.runId !== 'last-run'
    ? {
      runId: route.params.runId,
    }
    : {},
  snapshotId: route.query.snapshotId,
}), () => ({
  enabled: !!route.query.snapshotId,
  fetchPolicy: 'cache-and-network',
}))

const runId = computed(() => result.value?.run.id)

const snapshot = computed(() => result.value?.run.snapshot)
const test = computed(() => snapshot.value?.test as NexusGenFieldTypes['Test'] | undefined)
const suite = computed(() => test.value?.suite as NexusGenFieldTypes['TestSuite'] | undefined)

const nextSnapshotId = computed(() => result.value?.run.nextSnapshot.id)
const previousSnapshotId = computed(() => result.value?.run.previousSnapshot.id)

// Refetch

const { onResult } = useSubscription(gql`
  subscription runUpdated {
    runUpdated {
      id
    }
  }
`)
onResult(() => {
  refetch()
})
</script>

<template>
  <SnapshotView
    v-if="runId && snapshot && test && suite"
    :snapshot="snapshot"
    :test="test"
    :suite="suite"
    :run-id="runId"
    class="h-full"
    @next="$router.push({ ...$route, query: { ...$route.query, snapshotId: nextSnapshotId } })"
    @previous="$router.push({ ...$route, query: { ...$route.query, snapshotId: previousSnapshotId } })"
  />

  <TestViewPlaceholder
    v-else
  />
</template>
