import { describe, expect, it } from 'vitest'
import Calculator from '../Calculator.vue'
import { mountWithPlugins } from '@/test/test-utils'

async function clickKey(text: string, wrapper: Awaited<ReturnType<typeof mountWithPlugins>>['wrapper']) {
  const button = wrapper.findAll('button').find(item => item.text() === text)
  expect(button, `button ${text} should exist`).toBeDefined()
  await button!.trigger('click')
}

describe('Calculator', () => {
  it('renders formatted amount and emits model updates while typing', async () => {
    const { wrapper } = await mountWithPlugins(Calculator, {
      props: {
        currencySymbol: '$',
        saveButtonText: 'Save',
      },
    })

    await clickKey('1', wrapper)
    await clickKey('2', wrapper)
    await clickKey('.', wrapper)
    await clickKey('3', wrapper)

    expect(wrapper.find('.calc-value').text()).toBe('$12.3')
    const updates = wrapper.emitted('update:modelValue')
    expect(updates?.[updates.length - 1]).toEqual([12.3])
  })

  it('completes pending calculations before saving', async () => {
    const { wrapper } = await mountWithPlugins(Calculator, {
      props: {
        currencySymbol: '$',
        saveButtonText: 'Save',
      },
    })

    await clickKey('1', wrapper)
    await clickKey('0', wrapper)
    await clickKey('+', wrapper)
    await clickKey('5', wrapper)
    await clickKey('Save', wrapper)

    expect(wrapper.emitted('save')).toEqual([[15]])
  })

  it('does not save when disabled and uses compact icon mode', async () => {
    const { wrapper } = await mountWithPlugins(Calculator, {
      props: {
        compact: true,
        showDisplay: false,
        saveDisabled: true,
      },
    })

    expect(wrapper.classes()).toContain('compact')
    expect(wrapper.find('.calc-display').exists()).toBe(false)

    await wrapper.find('.calc-key.save').trigger('click')
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
