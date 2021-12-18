import { server } from './server.js'

export async function open (options) {
  server({
    ...options,
    open: true,
  })
}
