import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus'
import * as path from 'pathe'
import fs from 'fs-extra'
import os from 'os'
import type { Context } from '../context'

export const Settings = objectType({
  name: 'Settings',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.boolean('watch')
    t.nonNull.boolean('darkMode')
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
    t.nonNull.boolean('darkMode')
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
  darkMode: boolean
}

export const settings: SettingsData = {
  id: 'settings',
  watch: true,
  darkMode: false,
}

const settingsFile = path.resolve(os.homedir(), '.peeky', 'settings.json')
fs.ensureDirSync(path.dirname(settingsFile))

try {
  if (fs.existsSync(settingsFile)) {
    Object.assign(settings, fs.readJsonSync(settingsFile))
  }
} catch (e) {
  console.error(`Failed to load ${settingsFile}: ${e.message}`)
}

export async function updateSettings (ctx: Context, data: Partial<Omit<SettingsData, 'id'>>) {
  Object.assign(settings, data)
  try {
    fs.writeJsonSync(settingsFile, settings)
  } catch (e) {
    console.error(`Failed to write ${settingsFile}: ${e.message}`)
  }
  return settings
}
