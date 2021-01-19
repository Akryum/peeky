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

  const reactiveFs = await createReactiveFileSystem({
    baseDir: process.cwd(),
    glob: '**/*.(spec|test).(ts|js)',
    ignored: ['node_modules'],
  })
  const pubsub = new PubSub()

  function createContext (): Context {
    return {
      reactiveFs,
      pubsub,
    }
  }

  await loadTestFiles(createContext())

  const apollo = new ApolloServer({
    schema,
    context: createContext,
    playground: true,
    formatError (error) {
      consola.error(error)
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

  return {
    apollo,
    app,
    http,
  }
}
