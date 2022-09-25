import { basename, extname } from 'pathe'
import { nanoid } from 'nanoid'
import slugify from 'slugify'
import type { SuiteCollectData, TestCollectData } from '../message.js'
import type {
  AfterAllFn,
  AfterEachFn,
  BeforeAllFn,
  BeforeEachFn,
  Context,
  DescribeFn,
  TestFn,
  TestSuite,
  Test,
  TestFlag,
  TestSuiteChild,
} from '../types'
import { toMainThread } from './message.js'

const SKIP_SUITE_HANDLER = ['skip', 'todo']

export function setupTestCollector (ctx: Context): {
  exposed: {
    describe: DescribeFn
    test: TestFn
    beforeAll: BeforeAllFn
    afterAll: AfterAllFn
    beforeEach: BeforeEachFn
    afterEach: AfterEachFn
  }
  collect: () => Promise<void>
} {
  const currentSuites: TestSuite[] = []

  const getCurrentSuite = () => currentSuites[currentSuites.length - 1]

  const createSuite = (title: string, flag: TestFlag, parentSuite: TestSuite) => {
    const suite: TestSuite = {
      id: nanoid(),
      title,
      allTitles: [...parentSuite?.allTitles ?? [], title],
      filePath: ctx.options.entry,
      children: [],
      childrenToRun: [],
      parent: parentSuite,
      flag,
      beforeAllHandlers: [],
      beforeEachHandlers: [],
      afterAllHandlers: [],
      afterEachHandlers: [],
      ranTests: [],
      testErrors: 0,
      otherErrors: [],
    }
    return suite
  }

  const createRootSuite = () => {
    const title = slugify(basename(ctx.options.entry, extname(ctx.options.entry)))
      .replace(/\.(test|spec)/g, '')
      .replace(/\./g, '-')
    return createSuite(title, null, null)
  }

  const rootSuite: TestSuite = createRootSuite()
  currentSuites.push(rootSuite)
  ctx.suites.push(rootSuite)

  const addTest = (title: string, handler: () => unknown, flag: TestFlag = null) => {
    getCurrentSuite().children.push([
      'test',
      {
        id: nanoid(),
        title,
        handler,
        error: null,
        flag,
        failedSnapshots: 0,
        snapshots: [],
      },
    ])
  }

  const addSuite = (title: string, handler: () => unknown, flag: TestFlag = null) => {
    const parentSuite = getCurrentSuite()
    const suite = createSuite(title, flag, parentSuite)
    if (parentSuite) {
      parentSuite.children.push(['suite', suite])
    }
    currentSuites.push(suite)
    if (handler && !SKIP_SUITE_HANDLER.includes(flag)) {
      handler()
    }
    currentSuites.pop()
  }

  const describe = Object.assign(function describe (title: string, handler: () => unknown) {
    addSuite(title, handler)
  }, {
    skip: (title: string, handler: () => unknown) => {
      addSuite(title, handler, 'skip')
    },
    only: (title: string, handler: () => unknown) => {
      addSuite(title, handler, 'only')
    },
    todo: (title: string, handler?: () => unknown) => {
      addSuite(title, handler, 'todo')
    },
  })

  const test = Object.assign(function test (title: string, handler: () => unknown) {
    addTest(title, handler)
  }, {
    skip: (title: string, handler: () => unknown) => {
      addTest(title, handler, 'skip')
    },
    only: (title: string, handler: () => unknown) => {
      addTest(title, handler, 'only')
    },
    todo: (title: string, handler?: () => unknown) => {
      addTest(title, handler, 'todo')
    },
  })

  function beforeAll (handler: () => unknown) {
    getCurrentSuite().beforeAllHandlers.push(handler)
  }

  function afterAll (handler: () => unknown) {
    getCurrentSuite().afterAllHandlers.push(handler)
  }

  function beforeEach (handler: () => unknown) {
    getCurrentSuite().beforeEachHandlers.push(handler)
  }

  function afterEach (handler: () => unknown) {
    getCurrentSuite().afterEachHandlers.push(handler)
  }

  /**
   * Run the suite handlers to register suites and tests.
   * Shouldn't be exposed to the test files.
   */
  async function collect () {
    filterChildrenToRun(rootSuite)

    toMainThread().onCollected([
      mapSuite(rootSuite),
    ])
  }

  return {
    exposed: {
      describe,
      test,
      beforeAll,
      afterAll,
      beforeEach,
      afterEach,
    },
    collect,
  }
}

export type TestCollector = ReturnType<typeof setupTestCollector>

function filterChildrenToRun (suite: TestSuite) {
  let childrenToRun: TestSuiteChild[]
  const onlyChildren = suite.children.filter(([, t]) => t.flag === 'only')
  if (onlyChildren.length) {
    childrenToRun = onlyChildren
  } else {
    childrenToRun = suite.children.filter(([, t]) => t.flag !== 'skip' && t.flag !== 'todo')
  }
  suite.childrenToRun = childrenToRun

  for (const child of suite.children) {
    if (child[0] === 'suite') {
      filterChildrenToRun(child[1])
    }
  }
}

function mapSuite (suite: TestSuite): SuiteCollectData {
  return {
    id: suite.id,
    title: suite.title,
    allTitles: suite.allTitles,
    flag: suite.flag,
    children: suite.children.map(child => {
      if (child[0] === 'suite') {
        return ['suite', mapSuite(child[1])]
      } else if (child[0] === 'test') {
        return ['test', mapTest(child[1])]
      }
      return null
    }),
    filePath: suite.filePath,
    runTestCount: suite.childrenToRun.filter(c => c[0] === 'test').length,
  }
}

function mapTest (test: Test): TestCollectData {
  return {
    id: test.id,
    title: test.title,
    flag: test.flag,
  }
}
