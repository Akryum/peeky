import { MessageChannel } from 'worker_threads'
import type { FetchResult, ViteNodeResolveId } from 'vite-node'
import { TestFlag } from './types.js'
import { Snapshot } from './snapshot/types.js'

export interface WorkerRemoteMethods {
  onCollected: (suites: SuiteCollectData[]) => void
  onSuiteStart: (suite: SuiteStartData) => void
  onSuiteComplete: (suite: SuiteCompleteData, duration: number, completedTests: Record<string, number>) => void
  onTestError: (suiteId: string, testId: string, duration: number, error: TestErrorData) => void
  onTestSnapshotsProcessed: (suiteId: string, testId: string, snapshots: Snapshot[]) => void
  onTestEnvResult: (suiteId: string, testId: string, envResult: any) => void
  onLog: (suiteId: string, testId: string, type: 'stdout' | 'stderr', text: string, file?: string) => void
  fetchModule: (id: string) => Promise<FetchResult>
  resolveId: (id: string, importer?: string) => Promise<ViteNodeResolveId | null>
  testFileCompleteHandshake: () => Promise<void>
}

export interface TestErrorData {
  message: string
  stack: string
  data: any
  matcherResult: any
}

export interface SuiteCollectData {
  id: string
  title: string
  allTitles: string[]
  flag: TestFlag
  filePath: string
  children: SuiteChildCollectData[]
  runTestCount: number
}

export interface TestCollectData {
  id: string
  title: string
  flag: TestFlag
}

export type SuiteChildCollectData = ['suite', SuiteCollectData] | ['test', TestCollectData]

export interface SuiteStartData {
  id: string
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
