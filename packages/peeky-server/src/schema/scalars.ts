import { scalarType } from 'nexus'

export const Json = scalarType({
  name: 'Json',
  asNexusMethod: 'json',
  description: 'JSON custom scalar type',
  parseValue (value) {
    return value
  },
  serialize (value) {
    return value
  },
  parseLiteral (valueNode) {
    return valueNode.loc
  },
})
