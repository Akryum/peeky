// import { describe, test, expect } from '@peeky/test'
import { mount } from '@vue/test-utils'
import Hello from './Hello.vue'

describe('vue + peeky demo', () => {
  test('mount component', async () => {
    const wrapper = mount(Hello, {
      props: {
        count: 4,
      },
    })

    expect(wrapper.text()).toContain('4 x 2 = 8')
    // Available soon
    // expect(wrapper.html()).toMatchSnapshot()

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('4 x 3 = 12')

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('4 x 4 = 16')
  })
})
