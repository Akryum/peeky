/* eslint-disable vue/one-component-per-file */
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
    expect(el.innerHTML).toMatchSnapshot()
    expect('Hello').toMatchSnapshot('demo')
    expect('Meow').toMatchSnapshot('demo')
    expect('Meow3').toMatchSnapshot('demo')
    // expect(el.innerHTML).toBe('<div>hello</div>')
  })

  test('big app', () => {
    const app = createApp({
      data () {
        return {
          n: 100,
        }
      },
      template: '<div><ul><li v-for="i in n">{{ i }}</li></ul></div>',
    })
    console.log(app)
    const el = document.createElement('div')
    // document.body.appendChild(el)
    app.mount(el)
    expect(el.innerHTML).toMatchSnapshot()
  })
})
