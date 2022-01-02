<script lang="ts" setup>
import StatusIcon from '../StatusIcon.vue'

const props = defineProps({
  snapshot: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <router-link
    :to="{
      query: {
        ...$route.query,
        snapshotId: snapshot.id,
      },
    }"
    class="px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 space-x-2 h-8"
    :class="{
      'active-colors': $route.query.snapshotId === snapshot.id,
    }"
  >
    <StatusIcon
      :status="snapshot.failed ? 'error' : 'success'"
      class="w-5 h-5"
    />
    <span class="flex-1 truncate py-1">
      {{ snapshot.title }}
    </span>
  </router-link>
</template>
