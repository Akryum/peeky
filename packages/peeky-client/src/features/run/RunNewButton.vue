<script lang="ts" setup>
import { PlayIcon } from '@zhuowenli/vue-feather-icons'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import BaseButton from '../BaseButton.vue'

const { result } = useQuery(gql`
  query lastRunNewButton {
    lastRun {
      id
      status
    }
  }
`)
const lastRun = computed(() => result.value?.lastRun)

const { mutate, loading: mutating } = useMutation(gql`
  mutation startRun {
    startRun(input: {}) {
      id
      date
      emoji
      status
      progress
    }
  }
`, {
  update: (cache, { data: { startRun } }) => {
    const query = {
      query: gql`query lastRunCacheUpdate {
        lastRun {
          id
          date
          emoji
          status
          progress
        }
      }`,
    }
    cache.writeQuery({
      ...query,
      data: {
        lastRun: startRun,
      },
    })
  },
})

async function run () {
  await mutate()
}

const disabled = computed(() => mutating.value || lastRun.value?.status === 'in_progress')
</script>

<template>
  <BaseButton
    :disabled="disabled"
    class="p-2"
    @click="run"
  >
    <PlayIcon class="w-4 h-4" />
  </BaseButton>
</template>
