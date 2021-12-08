/* @peeky {
  runtimeEnv: 'dom'
} */

// Include template compiler
import { createApp } from 'vue/dist/vue.esm-bundler'

describe('vue', () => {
  test('create vue app', () => {
    const app = createApp({
      data () {
        return {
          msg: 'hello',
        }
      },
      template: '<div>hello</div>',
    })
    expect(typeof app.version).toBe('string')
    const el = document.createElement('div')
    document.body.appendChild(el)
    app.mount(el)
    expect(el.innerHTML).toBe('<div>hello</div>')
  })
})
