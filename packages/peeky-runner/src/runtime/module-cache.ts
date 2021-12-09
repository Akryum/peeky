import type { ViteExecutionResult } from './vite.js'

export const moduleCache: Map<string, Promise<ViteExecutionResult>> = new Map()
