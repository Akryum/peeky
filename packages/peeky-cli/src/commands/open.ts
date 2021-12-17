import { server } from './server'

export async function open (options) {
  server({
    ...options,
    open: true,
  })
}
