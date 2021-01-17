import { ApolloServer } from 'apollo-server'
import { makeSchema } from 'nexus'
import { join } from 'path'

export function createServer () {
  const schema = makeSchema({
    types: [],
    outputs: {
      typegen: join(__dirname, '..', 'generated', 'nexus-typegen.ts'),
      schema: join(__dirname, '..', 'generated', 'schema.graphql'),
    },
  })

  const server = new ApolloServer({
    schema,
  })

  return server
}
