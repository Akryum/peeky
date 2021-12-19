import { mount } from '@vue/test-utils'
import ButtonPrimary from './ButtonPrimary.vue'

describe('ButtonPrimary', () => {
  test('mount', async () => {
    const wrapper = mount(ButtonPrimary)
    await wrapper.vm.$nextTick()
    console.log(wrapper.html())
    expect(wrapper.html()).toContain('<button')
  })
})
