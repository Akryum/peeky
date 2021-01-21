<script lang="ts" setup>
import StatusIcon from './StatusIcon.vue'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { defineEmit, watch } from 'vue'
import { useRoute } from 'vue-router'

const emit = defineEmit()

const runListFragment = gql`
fragment runList on Run {
  id
  title
  emoji
  status
}
`

const { result, subscribeToMore } = useQuery(gql`
  query runs {
    runs {
      ...runList
    }
  }
  ${runListFragment}
`, {}, {
  fetchPolicy: 'cache-and-network',
})

const runs = useResult(result, [], data => data.runs.slice().reverse())

// Subs

// Updated
subscribeToMore({
  document: gql`
  subscription runUpdated {
    runUpdated {
      id
      status
      progress
    }
  }
  `,
})

// Added
subscribeToMore({
  document: gql`
  subscription runAdded {
    runAdded {
      ...runList
    }
  }
  ${runListFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (previousResult.run.find(f => f.id === data.runAdded.id)) return previousResult
    return {
      runs: [
        ...previousResult.runs,
        data.runAdded,
      ],
    }
  },
})

// Removed
subscribeToMore({
  document: gql`
  subscription runRemoved {
    runRemoved {
      id
    }
  }
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    return {
      runs: [
        ...previousResult.runs.filter(f => f.id !== data.runRemoved.id),
      ],
    }
  },
})

function close () {
  emit('close')
}

const route = useRoute()
watch(() => route.params.runId, () => {
  close()
})
</script>

<template>
  <div
    class="flex flex-col items-stretch overflow-y-auto"
    @click="close()"
  >
    <router-link
      :to="{
        name: 'last-run',
      }"
      class="flex-none px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-900"
    >
      Last run
    </router-link>

    <router-link
      v-for="run of runs"
      :key="run.id"
      :to="{
        name: 'run',
        params: {
          runId: run.id,
        },
      }"
      class="flex-none truncate px-3 py-2 flex items-center space-x-1 hover:bg-purple-100 dark:hover:bg-purple-900"
    >
      <StatusIcon
        :status="run.status"
        class="w-4 h-4 mr-1"
      />
      <span>{{ run.title }}</span>
      <span>{{ run.emoji }}</span>
    </router-link>
  </div>
</template>
