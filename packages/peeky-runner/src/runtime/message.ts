import type { MessagePort } from 'worker_threads'
import { nanoid } from 'nanoid'
import type { MainMessage, WorkerRemoteMethods } from '../message.js'

// Channel

let workerPort: MessagePort

export function initWorkerMessaging (port: MessagePort) {
  workerPort = port

  workerPort.on('message', (message: MainMessage) => {
    const promise = toMainPromiseMap?.get(message.id)
    if (promise) {
      if ('error' in message) {
        promise.reject(message.error)
      } else {
        promise.resolve(message.result)
      }
    }
  })
}

// Remote Methods

let toMainProxy: any

interface ToMainPromise {
  resolve: (...args: any[]) => unknown
  reject: (...args: any[]) => unknown
}

let toMainPromiseMap: Map<string, ToMainPromise> = new Map()

export function toMainThread (): WorkerRemoteMethods {
  if (!toMainProxy) {
    toMainPromiseMap = new Map()
    toMainProxy = new Proxy({}, {
      get: (target, method: string) => {
        return (...args) => {
          const id = nanoid()
          const promise = !method.startsWith('on')
            ? new Promise((resolve, reject) => {
              toMainPromiseMap.set(id, { resolve, reject })
            })
            : undefined
          workerPort.postMessage({ id, method, args })
          return promise
        }
      },
    })
  }

  return toMainProxy
}
