import consola from 'consola'
import { createServer } from './server.js'

(async () => {
  const {
    http,
  } = await createServer()
  const port = process.env.PORT || 4000
  http.listen(port, () => {
    consola.success(`🚀 Server ready at http://localhost:${port}`)
  })
})()
