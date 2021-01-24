import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

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

const link = split(
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
)

// Cache implementation
const cache = new InMemoryCache()

// Create the apollo client
export const apolloClient = new ApolloClient({
  link,
  cache,
})
