<script lang="ts" setup>
import RunSelector from './RunSelector.vue'
import BaseButton from './BaseButton.vue'
import RunNewButton from './RunNewButton.vue'
import RunItem from './RunItem.vue'
import { LayersIcon, ActivityIcon } from '@zhuowenli/vue-feather-icons'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { ref } from 'vue'

// Current run

const runDetailsFragment = gql`
fragment runDetails on Run {
  id
  title
  emoji
  status
  progress
  duration
}
`

const route = useRoute()
const { result, subscribeToMore } = useQuery(() => route.params.runId !== 'last-run' ? gql`
  query run ($id: ID!) {
    run (id: $id) {
      ...runDetails
    }
  }
  ${runDetailsFragment}
` : gql`
  query lastRun {
    lastRun {
      ...runDetails
    }
  }
  ${runDetailsFragment}
`, () => route.params.runId !== 'last-run' ? {
  id: route.params.runId,
} : {})
const currentRun = useResult(result)

const isSelectorOpen = ref(false)

// Subs

// Updated
subscribeToMore({
  document: gql`
  subscription runUpdated {
    runUpdated {
      id
      status
      progress
      duration
    }
  }
  `,
})

// Added
subscribeToMore({
  document: gql`
  subscription runAdded {
    runAdded {
      ...runDetails
    }
  }
  ${runDetailsFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (route.params.runId) {
      return previousResult
    } else {
      return {
        lastRun: data.runAdded,
      }
    }
  },
})
</script>

<template>
  <div
    v-bind="$attrs"
    class="relative"
  >
    <div
      v-if="currentRun?.status === 'in_progress'"
      class="absolute top-0 left-0 h-full bg-purple-100 dark:bg-purple-900 transition-all"
      :style="{
        width: `${currentRun.progress * 100}%`,
      }"
    />

    <div class="flex items-center space-x-1 pr-1 h-10">
      <div class="relative flex-1 w-0 truncate">
        <template v-if="currentRun">
          <RunItem
            :run="currentRun"
          />
        </template>
        <template v-else>
          <div class="flex items-center px-3 py-2">
            <ActivityIcon class="w-4 h-4 mr-2 text-gray-500" />
            <span class="text-gray-500">No run found here</span>
          </div>
        </template>
      </div>

      <BaseButton
        flat
        class="flex-none p-2"
        @click="isSelectorOpen = true"
      >
        <LayersIcon class="w-4 h-4" />
      </BaseButton>

      <RunNewButton class="flex-none" />
    </div>
  </div>

  <transition name="slide-from-left">
    <RunSelector
      v-if="isSelectorOpen"
      class="absolute inset-0 bg-white dark:bg-black z-10"
      @close="isSelectorOpen = false"
    />
  </transition>
</template>
