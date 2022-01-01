<script lang="ts" setup>
import { defineProps, PropType } from 'vue'
import type { NexusGenFieldTypes } from '@peeky/server/types'
import StatusIcon from '../StatusIcon.vue'
import Duration from '../Duration.vue'
import TimeAgo from '../TimeAgo.vue'

const props = defineProps({
  run: {
    type: Object as PropType<Pick<NexusGenFieldTypes['Run'], 'status' | 'date' | 'emoji' | 'duration'>>,
    required: true,
  },
})
</script>

<template>
  <div class="flex items-center space-x-1 truncate px-3 h-10">
    <StatusIcon
      :status="run.status"
      class="w-4 h-4 mr-1"
    />
    <span class="flex-1 truncate py-1 space-x-1">
      <span>
        <TimeAgo :date="run.date" />
      </span>
      <span>{{ run.emoji }}</span>
    </span>
    <Duration
      v-if="run.duration != null"
      :duration="run.duration"
      no-colors
    />
  </div>
</template>
