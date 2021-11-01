import { ReactiveFileSystem } from 'reactive-fs'
import { PubSubEngine } from 'apollo-server-express'
import { PeekyConfig } from '@peeky/config/dist'

export interface Context {
  config: PeekyConfig
  reactiveFs: ReactiveFileSystem
  pubsub: PubSubEngine
}
