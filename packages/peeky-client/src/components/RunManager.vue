<script lang="ts" setup>
import RunNewButton from './RunNewButton.vue'
import StatusIcon from './StatusIcon.vue'
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const { result, subscribeToMore } = useQuery(gql`
  query runs {
    runs {
      id
      title
      emoji
      status
    }
    lastRun {
      id
      title
      emoji
      status
      progress
    }
  }
`)

const runs = useResult(result, [], data => data.runs)
const lastRun = useResult(result, null, data => data.lastRun)

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
</script>

<template>
  <div class="flex items-center relative">
    <div
      v-if="lastRun?.status === 'in_progress'"
      class="absolute top-0 left-0 h-full bg-purple-100 dark:bg-purple-900 transition-all"
      :style="{
        width: `${lastRun.progress * 100}%`,
      }"
    />

    <div class="relative flex-1 w-0 truncate px-3 py-2 flex items-center space-x-1">
      <template v-if="lastRun">
        <StatusIcon
          :status="lastRun.status"
          class="w-4 h-4 mr-1"
        />
        <span>{{ lastRun.title }}</span>
        <span>{{ lastRun.emoji }}</span>
      </template>
      <template v-else>
        <span class="text-gray-500">No run found here</span>
      </template>
    </div>

    <RunNewButton class="flex-none mr-1" />
  </div>
</template>
