import { dirname, join } from 'pathe'
import HTTP from 'http'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { createReactiveFileSystem } from 'reactive-fs'
import { ApolloServer, PubSub } from 'apollo-server-express'
import express from 'express'
import historyFallback from 'express-history-api-fallback'
import { makeSchema } from 'nexus'
import consola from 'consola'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { setupConfigLoader } from '@peeky/config'
import type { Context } from './context'
import * as types from './schema/index.js'
import { loadTestFiles } from './schema/index.js'
import { setupRunWatch } from './watch.js'
import { run } from './run.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function createServer () {
  const useLegacyWebsockets = !!process.env.PEEKY_LEGACY_WS

  const schema = makeSchema({
    types,
    outputs: {
      typegen: join(__dirname, '..', 'src', 'generated', 'nexus-typegen.ts'),
      schema: join(__dirname, '..', 'src', 'generated', 'schema.graphql'),
    },
    shouldGenerateArtifacts: process.argv.includes('--nexus-artifacts'),
    shouldExitAfterGenerateArtifacts: process.argv.includes('--nexus-exit'),
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
    formatError (error) {
      consola.error(error)
      consola.log(JSON.stringify(error, null, 2))
      return error
    },
    subscriptions: useLegacyWebsockets ? {
      path: '/api',
    } : false,
  })

  const app = express()
  const http = HTTP.createServer(app)

  apollo.applyMiddleware({
    app,
    path: '/api',
  })

  if (useLegacyWebsockets) {
    apollo.installSubscriptionHandlers(http)
  }

  let wsServer: WebSocketServer

  if (!useLegacyWebsockets) {
    wsServer = new WebSocketServer({
      server: http,
      path: '/api',
    })
    useServer({
      schema,
      context: createContext,
    }, wsServer)
  }

  const require = createRequire(import.meta.url)
  const staticRoot = join(dirname(require.resolve('@peeky/client-dist/package.json')), 'dist')
  app.use(express.static(staticRoot))
  app.use(historyFallback('index.html', { root: staticRoot }))

  // (Don't await)
  run(createContext(), {
    testFileIds: null,
  })

  return {
    apollo,
    app,
    http,
    ws: wsServer,
  }
}
