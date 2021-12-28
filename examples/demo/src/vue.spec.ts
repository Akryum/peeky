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
      template: '<div>{{ msg }}</div>',
    })
    console.log(app)
    expect(typeof app.version).toBe('string')
    const el = document.createElement('div')
    document.body.appendChild(el)
    app.mount(el)
    expect(document.body.innerHTML).toMatchSnapshot()
    expect('Hello').toMatchSnapshot('demo')
    expect('Meow').toMatchSnapshot('demo')
    // expect(el.innerHTML).toBe('<div>hello</div>')
  })
})
