import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus'
import { Context } from '../context'

export const Settings = objectType({
  name: 'Settings',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.boolean('watch')
  },
})

export const SettingsQuery = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.field('settings', {
      type: Settings,
      resolve: () => settings,
    })
  },
})

export const UpdateSettingsInput = inputObjectType({
  name: 'UpdateSettingsInput',
  definition (t) {
    t.nonNull.boolean('watch')
  },
})

export const SettingsMutation = extendType({
  type: 'Mutation',
  definition (t) {
    t.nonNull.field('updateSettings', {
      type: Settings,
      args: {
        input: arg({
          type: nonNull(UpdateSettingsInput),
        }),
      },
      resolve: (root, { input }, ctx) => updateSettings(ctx, input),
    })
  },
})

export interface SettingsData {
  id: string
  watch: boolean
}

export const settings: SettingsData = {
  id: 'settings',
  watch: true,
}

export async function updateSettings (ctx: Context, data: Partial<Omit<SettingsData, 'id'>>) {
  Object.assign(settings, data)
  return settings
}
