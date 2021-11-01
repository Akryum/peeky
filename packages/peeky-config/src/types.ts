type ExternalOption =
  | (string | RegExp)[]
  | string
  | RegExp
  | ((
    source: string,
    importer: string | undefined,
    isResolved: boolean
  ) => boolean | null | undefined)

export interface PeekyConfig {
  targetDirectory?: string
  match?: string | string[]
  ignored?: string | string[]
  watchMatch?: string | string[]
  watchBaseDirectory?: string
  watchIgnored?: string | string[]
  watchThrottle?: number
  maxWorkers?: number
  emptySuiteError?: boolean
  collectCoverageMatch?: string | string[]
  external?: ExternalOption
}
