import { runAllTests } from '@peeky/runner'

(async () => {
  try {
    const { result, hasError } = await runAllTests({
      targetDirectory: process.cwd(),
    })
    console.log(JSON.stringify(result, null, 2))
    if (hasError) {
      throw new Error('Some tests failed')
    }
  } catch (e) {
    process.exit(1)
  }
})()
