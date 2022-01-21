
<script lang="ts" setup>
import { useQuery, useResult } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRoute } from 'vue-router'
import { defineProps, onMounted, ref, watch } from 'vue'
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

const logs = useResult(result, [], data => data.run.testSuite.test.logs)

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
  <TerminalView
    v-if="fontsLoaded"
    :logs="logs"
    class="w-full h-full"
  />
</template>
