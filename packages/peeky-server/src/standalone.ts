import consola from 'consola'
import { createServer } from './server.js'

(async () => {
  const port = parseInt(process.env.PORT || '4000')
  const vitePort = port + 1
  const {
    http,
  } = await createServer({
    vitePort,
  })
  http.listen(port, () => {
    consola.success(`🚀 Server ready at http://localhost:${port}`)
  })
})()
