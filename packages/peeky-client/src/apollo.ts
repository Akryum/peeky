import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { logErrorMessages } from '@vue/apollo-util'

const apiUrl = import.meta.env.VITE_GQL_URL as string

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: apiUrl,
})

// WebSocket link
let wsUrl: string
if (apiUrl.includes('http')) {
  wsUrl = apiUrl.replace('http', 'ws')
} else {
  wsUrl = `${window.location.protocol.replace('http', 'ws')}${window.location.hostname}:${window.location.port}${apiUrl}`
}

const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
    reconnect: true,
  },
})

const link = onError(error => {
  logErrorMessages(error)
}).concat(split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink,
))

// Cache implementation
function dedupeRefs (existing: { __ref: string }[], incoming: { __ref: string }[]) {
  const result = existing.map(item => item.__ref)
  for (const item of incoming) {
    if (!result.includes(item.__ref)) {
      result.push(item.__ref)
    }
  }
  return result.map(__ref => ({ __ref }))
}

const cache = new InMemoryCache({
  typePolicies: {
    Run: {
      fields: {
        testSuites: {
          merge: (existing, incoming) => {
            if (!existing) return incoming
            return dedupeRefs(existing, incoming)
          },
        },
      },
    },

    Test: {
      fields: {
        error: {
          merge: false,
        },
      },
    },

    TestSuite: {
      fields: {
        testBySlug: {
          merge: false,
        },
      },
    },
  },
})

// Create the apollo client
export const apolloClient = new ApolloClient({
  link,
  cache,
})
