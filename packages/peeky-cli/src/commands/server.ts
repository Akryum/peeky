import consola from 'consola'
import openInBrowser from 'open'
import portfinder from 'portfinder'
import { isPackageExists } from 'local-pkg'

export async function server (options) {
  try {
    if (!isPackageExists('@peeky/server')) {
      consola.info(`Installing @peeky/server...`)
      await (await import('@antfu/install-pkg')).installPackage('@peeky/server', { dev: true })
      consola.success(`@peeky/server installed, please restart your command.`)
      process.exit(1)
    }

    const port = options.port ?? process.env.PORT ?? await portfinder.getPortPromise({
      port: 5000,
    })
    const vitePort = await portfinder.getPortPromise({
      port: port + 1,
    })
    const { createServer } = await import('@peeky/server')
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
