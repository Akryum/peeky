import { createServer } from '.'

const server = createServer()
server.listen(process.env.PORT || 4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
