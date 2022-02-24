import type { Window } from 'happy-dom'
import { format as prettyFormat } from 'pretty-format'
import { PeekyConfig, TestEnvironmentBase, InstantiableTestEnvironmentClass } from '@peeky/config'
import HtmlFormat from '../snapshot/plugins/html.js'

export class NodeEnvironment extends TestEnvironmentBase {
  create () {
    // do nothing
  }

  getResult () {
    // do nothing
  }

  destroy () {
    // do nothing
  }
}

export class DomEnvironment extends TestEnvironmentBase {
  window: Window
  globalKeys: string[]

  async create () {
    const { Window } = await import('happy-dom')
    const { KEYS } = await import('./dom-keys.js')
    this.window = new Window()

    this.globalKeys = KEYS.concat(Object.getOwnPropertyNames(this.window))
      .filter(k => !k.startsWith('_'))
      .filter(k => !(k in global))

    for (const key of this.globalKeys) {
      global[key] = this.window[key]
    }
  }

  getResult () {
    return {
      html: prettyFormat(this.window.document.documentElement.outerHTML, {
        plugins: [
          HtmlFormat,
        ],
      }),
    }
  }

  destroy () {
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
