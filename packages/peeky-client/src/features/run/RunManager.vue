<script lang="ts" setup>
import BaseButton from '../BaseButton.vue'
import BaseSwitch from '../BaseSwitch.vue'
import RunSelector from './RunSelector.vue'
import RunNewButton from './RunNewButton.vue'
import RunItem from './RunItem.vue'
import {
  LayersIcon,
  ActivityIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SunIcon,
  MoonIcon,
} from '@zhuowenli/vue-feather-icons'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import { useSettings } from '../settings'
import { NexusGenFieldTypes } from '@peeky/server/src/generated/nexus-typegen'

// Current run

const runDetailsFragment = gql`
fragment runDetails on Run {
  id
  date
  emoji
  status
  progress
  duration
}
`

type Run = Pick<NexusGenFieldTypes['Run'], 'id' | 'date' | 'emoji' | 'status' | 'progress' | 'duration'>

const route = useRoute()
const { result, subscribeToMore } = useQuery<{
  run: Run
}>(() => route.params.runId !== 'last-run' ? gql`
  query run ($id: ID!) {
    run (id: $id) {
      ...runDetails
    }
  }
  ${runDetailsFragment}
` : gql`
  query lastRun {
    run: lastRun {
      ...runDetails
    }
  }
  ${runDetailsFragment}
`, () => route.params.runId !== 'last-run' ? {
  id: route.params.runId,
} : {})
const currentRun = computed(() => result.value?.run)

const isSelectorOpen = ref(false)
const isSubMenuOpen = ref(false)

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
    class="relative"
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

      <BaseButton
        color="gray"
        flat
        class="flex-none p-2"
        @click="isSubMenuOpen = !isSubMenuOpen"
      >
        <component
          :is="isSubMenuOpen ? ChevronUpIcon : ChevronDownIcon"
          class="w-4 h-4"
        />
      </BaseButton>
    </div>
  </div>

  <transition name="toolbar">
    <div
      v-if="isSubMenuOpen"
      v-bind="$attrs"
      class="h-10 flex items-center space-x-1 px-1"
    >
      <BaseSwitch
        v-model="watchEnabled"
        class="ml-2"
      >
        Watch
      </BaseSwitch>

      <div class="w-0 flex-1" />

      <BaseButton
        flat
        class="flex-none p-2"
        @click="darkMode = !darkMode"
      >
        <component
          :is="darkMode ? MoonIcon : SunIcon"
          class="w-4 h-4"
        />
      </BaseButton>

      <BaseButton
        flat
        class="flex-none p-2"
        @click="isSelectorOpen = true"
      >
        <LayersIcon class="w-4 h-4" />
      </BaseButton>
    </div>
  </transition>

  <transition name="slide-from-left">
    <RunSelector
      v-if="isSelectorOpen"
      class="absolute inset-0 bg-white dark:bg-black z-10"
      @close="isSelectorOpen = false"
    />
  </transition>
</template>
