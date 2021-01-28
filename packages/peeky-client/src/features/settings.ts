import { useMutation, useQuery, useResult } from '@vue/apollo-composable'
import type { NexusGenInputs, NexusGenObjects } from '@peeky/server/src/generated/nexus-typegen'
import gql from 'graphql-tag'
import { ComputedRef } from 'vue'

export const settingsFragment = gql`
fragment settings on Settings {
  id
  watch
}
`

export function useSettings () {
  const { result, loading } = useQuery(gql`
    query settings {
      settings {
        ...settings
      }
    }
    ${settingsFragment}
  `)
  const settings = useResult(result) as ComputedRef<NexusGenObjects['Settings']>

  const { mutate } = useMutation(gql`
    mutation updateSettings ($input: UpdateSettingsInput!) {
      updateSettings (input: $input) {
        ...settings
      }
    }
    ${settingsFragment}
  `)

  async function updateSettings (input: NexusGenInputs['UpdateSettingsInput']) {
    return mutate({
      input,
    })
  }

  return {
    settings,
    loading,
    updateSettings,
  }
}
