// import { describe, test, expect } from '@peeky/test'
import { mount } from '@vue/test-utils'
import Meow from './Meow.vue'

test('meow', async () => {
  const wrapper = mount(Meow)

  expect(wrapper.html()).toMatchSnapshot()
})
