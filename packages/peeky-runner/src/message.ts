import { MessageChannel } from 'worker_threads'
import type { TransformResult } from 'vite'
import { TestFlag } from './types.js'

export interface WorkerRemoteMethods {
  onSuiteStart: (suite: SuiteStartData) => void
  onSuiteComplete: (suite: SuiteCompleteData, duration: number) => void
  onTestStart: (suiteId: string, testId: string) => void
  onTestError: (suiteId: string, testId: string, duration: number, error: TestErrorData) => void
  onTestSuccess: (suiteId: string, testId: string, duration: number) => void
  transform: (id: string) => Promise<TransformResult>
  onLog: (suiteId: string, testId: string, type: 'stdout' | 'stderr', text: string, file?: string) => void
  testFileCompleteHandshake: () => Promise<void>
}

export interface TestErrorData {
  message: string
  stack: string
  data: any
  matcherResult: any
}

export interface SuiteStartData {
  id: string
  title: string
  filePath: string
  tests: {
    id: string
    title: string
    flag: TestFlag
  }[]
  runTestCount: number
}

export interface SuiteCompleteData {
  id: string
  testErrors: number
  otherErrors: Error[]
}

export type WorkerMessage<K extends keyof WorkerRemoteMethods = keyof WorkerRemoteMethods> =
  K extends any ? {
    id: string
    method: K
    args: Parameters<WorkerRemoteMethods[K]>
  } : never;

export interface MainMessageResult {
  id: string
  result: any
}

export interface MainMessageError {
  id: string
  error: Error
}

export type MainMessage = MainMessageResult | MainMessageError

export type WorkerMessageHandler = (message: WorkerMessage) => unknown

export function useWorkerMessages () {
  const eventHandlers: WorkerMessageHandler[] = []

  function onMessage (handler: WorkerMessageHandler) {
    eventHandlers.push(handler)
  }

  function clearOnMessage () {
    eventHandlers.length = 0
  }

  async function handleMessage (message: WorkerMessage) {
    for (const handler of eventHandlers) {
      try {
        await handler(message)
      } catch (e) {
        console.error(`An error occured while handling message`, message)
        console.error(e)
      }
    }
  }

  return {
    onMessage,
    clearOnMessage,
    handleMessage,
  }
}

export function createWorkerChannel (methods: Partial<WorkerRemoteMethods>, handleMessage: (message: WorkerMessage) => unknown) {
  const channel = new MessageChannel()
  const mainPort = channel.port2
  const workerPort = channel.port1

  mainPort.on('message', async <T extends keyof WorkerRemoteMethods = keyof WorkerRemoteMethods>(message: WorkerMessage<T>) => {
    if (methods[message.method]) {
      try {
        // @ts-expect-error TypeScript is dumb
        const result = await methods[message.method](...message.args)

        if (!message.method.startsWith('on')) {
          mainPort.postMessage({
            id: message.id,
            result,
          } as MainMessageResult)
        }
      } catch (e) {
        mainPort.postMessage({
          id: message.id,
          error: e,
        } as MainMessageError)
      }
    }

    handleMessage(message)
  })

  return {
    mainPort,
    workerPort,
  }
}
