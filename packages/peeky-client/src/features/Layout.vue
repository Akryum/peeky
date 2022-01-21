<script lang="ts" setup>
import { watch } from 'vue'
import { useSettings } from './settings'
import DisconnectedToast from './DisconnectedToast.vue'
import { connected } from '../apollo'

const { settings } = useSettings()

watch(settings, value => {
  if (!value) return
  if (value.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  document.documentElement.classList.remove('loading')
}, { deep: true, immediate: true })
</script>

<template>
  <div
    :class="{
      'grayscale': !connected
    }"
  >
    <router-view />
  </div>

  <DisconnectedToast v-if="!connected" />
</template>
