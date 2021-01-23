import { createReactiveFileSystem } from '@peeky/reactive-fs'
import { ApolloServer, PubSub } from 'apollo-server-express'
import express from 'express'
import { makeSchema } from 'nexus'
import { join } from 'path'
import { Context } from './context'
import * as types from './schema'
import { loadTestFiles } from './schema'
import HTTP from 'http'
import consola from 'consola'
import { setupConfigLoader } from '@peeky/config'
import { setupRunWatch } from './watch'
import { run } from './run'

export async function createServer () {
  const schema = makeSchema({
    types,
    outputs: {
      typegen: join(__dirname, '..', 'src', 'generated', 'nexus-typegen.ts'),
      schema: join(__dirname, '..', 'src', 'generated', 'schema.graphql'),
    },
    contextType: {
      module: join(__dirname, '..', 'src', 'context.d.ts'),
      export: 'Context',
    },
  })

  const configLoader = await setupConfigLoader()
  const config = await configLoader.loadConfig()

  const reactiveFs = await createReactiveFileSystem({
    baseDir: config.targetDirectory,
    glob: config.match,
    ignored: config.ignored,
  })
  const pubsub = new PubSub()

  function createContext (): Context {
    return {
      config,
      reactiveFs,
      pubsub,
    }
  }

  await loadTestFiles(createContext())
  await setupRunWatch(createContext())

  const apollo = new ApolloServer({
    schema,
    context: createContext,
    playground: true,
    subscriptions: {
      path: '/api',
    },
    formatError (error) {
      consola.error(error)
      consola.log(JSON.stringify(error, null, 2))
      return error
    },
  })

  const app = express()
  const http = HTTP.createServer(app)

  apollo.applyMiddleware({
    app,
    path: '/api',
  })
  apollo.installSubscriptionHandlers(http)

  // (Don't await)
  run(createContext(), {
    testFileIds: null,
  })

  return {
    apollo,
    app,
    http,
  }
}
