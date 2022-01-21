<script lang="ts" setup>
import {
  ActivityIcon,
  MoreVerticalIcon,
  SunIcon,
  MoonIcon,
} from '@zhuowenli/vue-feather-icons'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { NexusGenFieldTypes } from '@peeky/server/types'
import { useSettings } from '../settings'
import BaseButton from '../BaseButton.vue'
import BaseSwitch from '../BaseSwitch.vue'
import RunSelector from './RunSelector.vue'
import RunNewButton from './RunNewButton.vue'
import RunItem from './RunItem.vue'
import RunTabs from './RunTabs.vue'

// Current run

const runDetailsFragment = gql`
fragment runDetails on Run {
  id
  date
  emoji
  status
  progress
  duration
  snapshotCount
  failedSnapshotCount
}
`

type Run = Pick<NexusGenFieldTypes['Run'], 'id' | 'date' | 'emoji' | 'status' | 'progress' | 'duration' | 'snapshotCount' | 'failedSnapshotCount'>

const route = useRoute()
const { result, subscribeToMore } = useQuery<{
  run: Run
}>(() => route.params.runId !== 'last-run'
  ? gql`
  query run ($id: ID!) {
    run (id: $id) {
      ...runDetails
    }
  }
  ${runDetailsFragment}
`
  : gql`
  query lastRun {
    run: lastRun {
      ...runDetails
    }
  }
  ${runDetailsFragment}
`, () => route.params.runId !== 'last-run'
  ? {
    id: route.params.runId,
  }
  : {})
const currentRun = computed(() => result.value?.run)

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
      snapshotCount
      failedSnapshotCount
    }
  }
  `,
})

// Added
subscribeToMore<undefined, {
  runAdded: Run
}>({
  document: gql`
  subscription runAdded {
    runAdded {
      ...runDetails
    }
  }
  ${runDetailsFragment}
  `,
  updateQuery: (previousResult, { subscriptionData: { data } }) => {
    if (route.params.runId && route.params.runId !== 'last-run') {
      return previousResult
    } else {
      return {
        run: data.runAdded,
      }
    }
  },
})

// Settings

const { settings, updateSettings } = useSettings()

const watchEnabled = computed<boolean>({
  get () {
    return !!settings.value?.watch
  },
  set (value) {
    updateSettings({
      watch: value,
    })
  },
})

const darkMode = computed<boolean>({
  get () {
    return !!settings.value?.darkMode
  },
  set (value) {
    updateSettings({
      darkMode: value,
    })
  },
})
</script>

<template>
  <div
    v-bind="$attrs"
    class="relative flex-none bg-gray-50 dark:bg-gray-950"
  >
    <transition name="progress-bar">
      <div
        v-if="currentRun?.status === 'in_progress'"
        class="absolute top-0 left-0 h-full bg-primary-100 dark:bg-primary-900 transition-all"
        :style="{
          width: `${currentRun.progress * 100}%`,
        }"
      />
    </transition>

    <div class="relative flex items-center space-x-1 pr-1 h-10">
      <div class="flex-1 w-0 truncate">
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

      <RunNewButton class="flex-none" />

      <VDropdown
        placement="bottom-start"
        :distance="10"
      >
        <BaseButton
          color="gray"
          flat
          class="flex-none p-2"
        >
          <MoreVerticalIcon class="w-4 h-4" />
        </BaseButton>

        <template #popper="{ hide }">
          <div class="py-2 min-w-[300px]">
            <BaseSwitch
              v-model="watchEnabled"
              class="ml-2 p-2"
            >
              Watch
            </BaseSwitch>
            <BaseSwitch
              v-model="darkMode"
              class="ml-2 p-2"
            >
              <span class="flex items-center space-x-2">
                <span>Dark mode</span>
                <component
                  :is="darkMode ? MoonIcon : SunIcon"
                  class="w-4 h-4 relative top-[1px]"
                />
              </span>
            </BaseSwitch>

            <hr class="border-gray-100 dark:border-gray-800 my-1">

            <RunSelector
              @close="hide()"
            />
          </div>
        </template>
      </VDropdown>
    </div>
  </div>

  <RunTabs
    v-if="currentRun"
    :run="currentRun"
  />
</template>
