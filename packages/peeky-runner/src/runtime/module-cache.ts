import type { ViteExecutionResult } from './vite.js'

export const moduleCache: Map<string, Promise<ViteExecutionResult>> = new Map()
export const sourceMaps: Map<string, any> = new Map()
