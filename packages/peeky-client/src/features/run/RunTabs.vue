<script lang="ts" setup>
import { defineProps, PropType } from 'vue'
import type { NexusGenFieldTypes } from '@peeky/server/types'
import BaseTab from '../BaseTab.vue'

const props = defineProps({
  run: {
    type: Object as PropType<Pick<NexusGenFieldTypes['Run'], 'snapshotCount' | 'failedSnapshotCount'>>,
    required: true,
  },
})
</script>

<template>
  <nav class="h-10">
    <BaseTab :to="{ name: 'run-test' }">
      Tests
    </BaseTab>
    <BaseTab :to="{ name: 'run-snapshot' }">
      <div class="flex items-center space-x-2">
        <span>Snapshots</span>
        <div
          v-if="run.failedSnapshotCount"
          class="text-xs px-1.5 rounded-full leading-tight text-red-200 bg-red-600 mt-0.5"
        >
          {{ run.failedSnapshotCount }}
        </div>
        <div
          v-else-if="run.snapshotCount"
          class="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"
        />
      </div>
    </BaseTab>
  </nav>
</template>
