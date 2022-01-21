<script lang="ts" setup>
import { CloudOffIcon } from '@zhuowenli/vue-feather-icons'
</script>

<template>
  <div class="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none">
    <div class="px-6 py-3 rounded bg-red-200 dark:bg-red-800 pointer-events-auto flex flex-col items-center space-y-3 shadow-md">
      <CloudOffIcon class="w-6 h-6" />
      <span>Disconnected</span>
    </div>
  </div>
</template>
