import { createServer } from '@peeky/server'
import consola from 'consola'
import openInBrowser from 'open'
import portfinder from 'portfinder'

export async function server (options) {
  try {
    const port = options.port ?? process.env.PORT ?? await portfinder.getPortPromise({
      startPort: 5000,
    })
    const vitePort = await portfinder.getPortPromise({
      startPort: port,
    })
    const {
      http,
    } = await createServer({
      vitePort,
    })
    http.listen(port, () => {
      const url = `http://localhost:${port}`
      consola.success(`🚀 Server ready at ${url}`)
      if (options.open) {
        openInBrowser(url)
      }
    })
  } catch (e) {
    consola.error(e)
    process.exit(1)
  }
}
