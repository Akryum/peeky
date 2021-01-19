import { ReactiveFileSystem } from '@peeky/reactive-fs'
import { PubSubEngine } from 'apollo-server-express'

export interface Context {
  reactiveFs: ReactiveFileSystem
  pubsub: PubSubEngine
}
