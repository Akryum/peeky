
<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { TerminalIcon } from '@zhuowenli/vue-feather-icons'
import TerminalView from '../terminal/TerminalView.vue'

const route = useRoute()

const props = defineProps({
  test: {
    type: Object,
    required: true,
  },

  suite: {
    type: Object,
    required: true,
  },
})

const { result, refetch } = useQuery(() => gql`
  query testLogs ($runId: ID!, $suiteId: ID!, $testId: ID!) {
    run (id: $runId) {
      id
      testSuite: testSuiteById (id: $suiteId) {
        id
        test: testById (id: $testId) {
          id
          logs {
            type,
            text
          }
        }
      }
    }
  }
`, () => ({
  runId: route.params.runId,
  suiteId: props.suite.id,
  testId: props.test.id,
}), {
  fetchPolicy: 'no-cache',
})

const logs = computed(() => result.value?.run.testSuite.test.logs ?? [])

watch(() => props.test.status, () => {
  refetch()
})

// Fonts

const fontsLoaded = ref(false)
onMounted(async () => {
  await document.fonts.load('14px "Fira Code"')
  fontsLoaded.value = true
})
</script>

<template>
  <div
    v-if="!logs.length"
    class="h-full flex flex-col items-center justify-center space-y-4"
  >
    <TerminalIcon class="w-24 h-24 text-primary-500 bg-primary-100 dark:bg-primary-900 rounded-full p-4" />
    <div class="text-3xl opacity-50">
      No logs yet
    </div>
    <div>Console output will appear here.</div>
  </div>

  <TerminalView
    v-else-if="fontsLoaded"
    :logs="logs"
    class="w-full h-full"
  />
</template>
