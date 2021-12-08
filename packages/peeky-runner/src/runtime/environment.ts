import { PeekyConfig, TestEnvironmentBase, InstantiableTestEnvironmentClass } from '@peeky/config'
import { Awaitable } from '@peeky/utils'
import { Window } from 'happy-dom'
import { KEYS } from './dom-keys.js'

export class NodeEnvironment extends TestEnvironmentBase {
  create (): Awaitable<void> {
    // do nothing
  }

  destroy (): Awaitable<void> {
    // do nothing
  }
}

export class DomEnvironment extends TestEnvironmentBase {
  window: Window
  globalKeys: string[]

  create (): Awaitable<void> {
    this.window = new Window()

    this.globalKeys = KEYS.concat(Object.getOwnPropertyNames(this.window))
      .filter(k => !k.startsWith('_'))
      .filter(k => !(k in global))

    for (const key of this.globalKeys) {
      global[key] = this.window[key]
    }
  }

  destroy (): Awaitable<void> {
    this.globalKeys.forEach(key => delete global[key])
    this.globalKeys.length = 0
    this.window.happyDOM.cancelAsync()
    this.window = null
  }
}

const builtinEnvs = {
  node: NodeEnvironment,
  dom: DomEnvironment,
}

export function getTestEnvironment (id: string, config: PeekyConfig): InstantiableTestEnvironmentClass {
  if (id in builtinEnvs) {
    return builtinEnvs[id]
  }

  if (config.runtimeAvailableEnvs && id in config.runtimeAvailableEnvs) {
    return config.runtimeAvailableEnvs[id] as InstantiableTestEnvironmentClass
  }

  throw new Error(`Unknown test environment: ${id}. Did you register it in the config with the runtimeAvailableEnvs option?`)
}
