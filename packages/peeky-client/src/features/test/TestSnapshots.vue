
<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute, useRouter } from 'vue-router'
import { computed, defineProps, watch } from 'vue'

import BaseSplitPane from '../BaseSplitPane.vue'
import SnapshotItem from '../snapshot/SnapshotItem.vue'
import SnapshotView from '../snapshot/SnapshotView.vue'

const route = useRoute()
const router = useRouter()

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

const { result, refetch } = useQuery(() => gql`
  query testLogs ($runId: ID!, $suiteId: ID!, $testId: ID!) {
    run (id: $runId) {
      id
      testSuite: testSuiteById (id: $suiteId) {
        id
        test: testById (id: $testId) {
          id
          snapshots {
            id
            title
            content
            newContent
            line
            col
            failed
            updated
          }
        }
      }
    }
  }
`, () => ({
  runId: route.params.runId,
  suiteId: props.suite.id,
  testId: props.test.id,
}), {
  fetchPolicy: 'network-only',
})

const snapshots = computed(() => result.value?.run?.testSuite?.test?.snapshots ?? [])

watch(() => props.test.status, () => {
  refetch()
})

const selectedSnapshot = computed(() => snapshots.value.find((s: any) => s.id === route.query.snapshotId))

function selectPrevious () {
  let index = snapshots.value.indexOf(selectedSnapshot.value)
  index--
  if (index < 0) {
    index = snapshots.value.length - 1
  }
  router.push({
    query: {
      ...route.query,
      snapshotId: snapshots.value[index].id,
    },
  })
}

function selectNext () {
  let index = snapshots.value.indexOf(selectedSnapshot.value)
  index++
  if (index > snapshots.value.length - 1) {
    index = 0
  }
  router.push({
    query: {
      ...route.query,
      snapshotId: snapshots.value[index].id,
    },
  })
}
</script>

<template>
  <BaseSplitPane
    :default-split="30"
    :min="5"
    :max="70"
    save-id="peeky-test-snapshots"
    class="h-full"
  >
    <template #first>
      <div class="overflow-auto">
        <SnapshotItem
          v-for="snapshot of snapshots"
          :key="snapshot.id"
          :snapshot="snapshot"
        />
      </div>
    </template>

    <template #last>
      <SnapshotView
        v-if="selectedSnapshot"
        :snapshot="selectedSnapshot"
        :test="test"
        :suite="suite"
        :run-id="$route.params.runId"
        class="h-full"
        @previous="selectPrevious()"
        @next="selectNext()"
      />
    </template>
  </BaseSplitPane>
</template>
