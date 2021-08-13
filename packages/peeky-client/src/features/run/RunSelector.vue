<script lang="ts" setup>
import RunItem from './RunItem.vue'
import { RotateCcwIcon } from '@zhuowenli/vue-feather-icons'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { defineEmits, watch } from 'vue'
import { useRoute } from 'vue-router'

const emit = defineEmits(['close'])

const runListFragment = gql`
fragment runList on Run {
  id
  title
  emoji
  status
  duration
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
  subscription runUpdatedForRunSelector {
    runUpdated {
      id
      status
      duration
    }
  }
  `,
})

// Added
subscribeToMore({
  document: gql`
  subscription runAddedForRunSelector {
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
        name: 'run',
        params: {
          runId: 'last-run',
        },
      }"
      class="flex-none px-3 h-10 flex items-center hover:bg-flamingo-100 dark:hover:bg-flamingo-900"
    >
      <RotateCcwIcon class="w-4 h-4 mr-2" />
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
      class="flex-none hover:bg-flamingo-100 dark:hover:bg-flamingo-900"
    >
      <RunItem
        :run="run"
      />
    </router-link>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply bg-flamingo-50 text-flamingo-800 dark:bg-flamingo-900 dark:text-flamingo-200;
}
</style>
