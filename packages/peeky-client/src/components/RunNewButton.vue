<script lang="ts" setup>
import BaseButton from './BaseButton.vue'
import { PlayIcon } from '@zhuowenli/vue-feather-icons'
import { useMutation, useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'

const { result } = useQuery(gql`
  query lastRunNewButton {
    lastRun {
      id
      status
    }
  }
`)
const lastRun = useResult(result, null)

const { mutate, loading: mutating } = useMutation(gql`
  mutation startRun {
    startRun(input: {}) {
      id
      title
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
          title
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
    flat
    :disabled="disabled"
    class="p-2"
    @click="run"
  >
    <PlayIcon class="w-4 h-4" />
  </BaseButton>
</template>
