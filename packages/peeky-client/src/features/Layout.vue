<script lang="ts" setup>
import { watch } from 'vue'
import { useSettings } from './settings'

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
  <router-view />
</template>
