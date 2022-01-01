import { useMutation, useQuery } from '@vue/apollo-composable'
import type { NexusGenInputs, NexusGenFieldTypes } from '@peeky/server'
import gql from 'graphql-tag'
import { computed } from 'vue'

export const settingsFragment = gql`
fragment settings on Settings {
  id
  watch
  darkMode
}
`

type Settings = Pick<NexusGenFieldTypes['Settings'], 'id' | 'watch' | 'darkMode'>

export function useSettings () {
  const { result, loading } = useQuery<{
    settings: Settings
  }>(gql`
    query settings {
      settings {
        ...settings
      }
    }
    ${settingsFragment}
  `)
  const settings = computed(() => result.value?.settings)

  const { mutate } = useMutation(gql`
    mutation updateSettings ($input: UpdateSettingsInput!) {
      updateSettings (input: $input) {
        ...settings
      }
    }
    ${settingsFragment}
  `)

  async function updateSettings (input: Partial<NexusGenInputs['UpdateSettingsInput']>) {
    return mutate({
      input: {
        ...settings.value,
        ...input,
        __typename: undefined,
        id: undefined,
      },
    })
  }

  return {
    settings,
    loading,
    updateSettings,
  }
}
