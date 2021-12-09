import { createServer } from '@peeky/server'
import consola from 'consola'
import openInBrowser from 'open'
import portfinder from 'portfinder'

export async function open (options) {
  try {
    const {
      http,
    } = await createServer()
    const port = options.port ?? process.env.PORT ?? await portfinder.getPortPromise({
      startPort: 5000,
    })
    http.listen(port, () => {
      const url = `http://localhost:${port}`
      consola.success(`🚀 Server ready at ${url}`)
      openInBrowser(url)
    })
  } catch (e) {
    consola.error(e)
    process.exit(1)
  }
}
