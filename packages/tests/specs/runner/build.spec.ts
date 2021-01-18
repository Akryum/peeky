import { getCachePath } from '../../../peeky-runner/src/build'

describe('build cache', () => {
  it('generates a cache path', () => {
    sinon.stub(process, 'cwd').callsFake(() => '/home/acme/project')
    expect(getCachePath('/home/acme/project/src/test.spec.js')).to.equal('/home/acme/project/node_modules/.temp/peeky-build-cache/src_test_spec_js.json')
  })
})
