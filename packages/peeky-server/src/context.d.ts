import type { PubSubEngine } from 'apollo-server-express'
import type { PeekyConfig } from '@peeky/config/dist'
import type { ViteDevServer } from 'vite'

export interface Context {
  config: PeekyConfig
  pubsub: PubSubEngine
  vitePort: number
  viteServer: ViteDevServer
}
