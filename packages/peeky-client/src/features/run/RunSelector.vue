<script lang="ts" setup>
import RunItem from './RunItem.vue'
import { RotateCcwIcon } from '@zhuowenli/vue-feather-icons'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed, defineEmits, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NexusGenFieldTypes } from '@peeky/server/src/generated/nexus-typegen'

const emit = defineEmits(['close'])

const MAX_RUNS = 10

const runListFragment = gql`
fragment runList on Run {
  id
  date
  emoji
  status
  duration
}
`

type Run = Pick<NexusGenFieldTypes['Run'], 'id' | 'date' | 'emoji' | 'status' | 'duration'>

const { result, subscribeToMore } = useQuery<{
  runs: Run[]
}>(gql`
  query runs {
    runs {
      ...runList
    }
  }
  ${runListFragment}
`, {}, {
  fetchPolicy: 'cache-and-network',
})

const runs = computed(() => result.value?.runs.slice().reverse() ?? [])

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
subscribeToMore<undefined, {
  runAdded: Run
}>({
  document: gql`
  subscription runAddedForRunSelector {
    runAdded {
      ...runList
    }
  }
  ${runListFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (previousResult.runs.find(f => f.id === data.runAdded.id)) return previousResult

    let runs = previousResult.runs
    if (runs.length > MAX_RUNS) {
      runs = runs.slice(1)
    }

    return {
      runs: [
        ...runs,
        data.runAdded,
      ],
    }
  },
})

// Removed
subscribeToMore<undefined, {
  runRemoved: {
    id: string
  }
}>({
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
      class="flex-none px-3 h-10 flex items-center hover:bg-primary-100 dark:hover:bg-primary-900"
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
      class="flex-none hover:bg-primary-100 dark:hover:bg-primary-900"
    >
      <RunItem
        :run="run"
      />
    </router-link>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply bg-primary-50 text-primary-800 dark:bg-primary-900 dark:text-primary-200;
}
</style>
