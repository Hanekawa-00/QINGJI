import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DesktopSidebar from '../DesktopSidebar.vue'
import { mountWithPlugins } from '@/test/test-utils'

const routes = [
  { path: '/desktop', component: { template: '<div>Dashboard</div>' } },
  { path: '/desktop/calendar', component: { template: '<div>Calendar</div>' } },
  { path: '/desktop/reports', component: { template: '<div>Reports</div>' } },
  { path: '/desktop/entry', component: { template: '<div>Entry</div>' } },
  { path: '/desktop/settings', component: { template: '<div>Settings</div>' } },
]

const menuStub = {
  props: ['options', 'value'],
  emits: ['update:value'],
  template: `
    <nav data-test="sidebar-menu">
      <button
        v-for="item in options"
        :key="item.key"
        :class="{ active: value === item.key }"
        @click="$emit('update:value', item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
  `,
}

describe('DesktopSidebar', () => {
  it('renders core navigation items and the current balance card', async () => {
    const { wrapper } = await mountWithPlugins(DesktopSidebar, {
      routes,
      initialPath: '/desktop',
      global: {
        stubs: {
          NMenu: menuStub,
          'n-menu': menuStub,
          Menu: menuStub,
          NCard: { template: '<section><slot /><slot name="header" /></section>' },
          'n-card': { template: '<section><slot /><slot name="header" /></section>' },
          Card: { template: '<section><slot /><slot name="header" /></section>' },
          NStatistic: {
            props: ['label', 'value'],
            template: '<div><span>{{ label }}</span><strong>{{ value }}</strong></div>',
          },
          'n-statistic': {
            props: ['label', 'value'],
            template: '<div><span>{{ label }}</span><strong>{{ value }}</strong></div>',
          },
          Statistic: {
            props: ['label', 'value'],
            template: '<div><span>{{ label }}</span><strong>{{ value }}</strong></div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('QINGJI')
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Calendar')
    expect(wrapper.text()).toContain('Reports')
    expect(wrapper.text()).toContain('New Entry')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Current Balance')
  })

  it('navigates when a menu item is selected', async () => {
    const { wrapper, router } = await mountWithPlugins(DesktopSidebar, {
      routes,
      initialPath: '/desktop',
      global: {
        stubs: {
          NMenu: menuStub,
          'n-menu': menuStub,
          Menu: menuStub,
          NCard: { template: '<section><slot /></section>' },
          'n-card': { template: '<section><slot /></section>' },
          Card: { template: '<section><slot /></section>' },
          NStatistic: true,
          'n-statistic': true,
          Statistic: true,
        },
      },
    })

    const buttons = wrapper.findAll('[data-test="sidebar-menu"] button')
    expect(buttons).toHaveLength(5)
    await buttons[2].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/desktop/reports')
  })
})
