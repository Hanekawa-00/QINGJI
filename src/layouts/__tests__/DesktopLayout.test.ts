import { describe, expect, it } from 'vitest'
import DesktopLayout from '../DesktopLayout.vue'
import { shallowMountWithPlugins } from '@/test/test-utils'

const routes = [
  {
    path: '/desktop',
    component: DesktopLayout,
    children: [
      { path: '', component: { template: '<div data-test="page">Dashboard</div>' } },
      { path: 'entry', component: { template: '<div data-test="page">Entry</div>' } },
    ],
  },
]

describe('DesktopLayout', () => {
  it('renders shell regions for sidebar, window controls, and routed content', async () => {
    const { wrapper } = await shallowMountWithPlugins(DesktopLayout, {
      routes,
      initialPath: '/desktop',
      global: {
        stubs: {
          ActionBar: { template: '<div data-test="action-bar" />' },
          'action-bar': { template: '<div data-test="action-bar" />' },
          DesktopSidebar: { template: '<aside data-test="desktop-sidebar" />' },
          'desktop-sidebar': { template: '<aside data-test="desktop-sidebar" />' },
          NLayout: { template: '<main><slot /></main>' },
          'n-layout': { template: '<main><slot /></main>' },
          Layout: { template: '<main><slot /></main>' },
          NLayoutSider: { template: '<aside><slot /></aside>' },
          'n-layout-sider': { template: '<aside><slot /></aside>' },
          LayoutSider: { template: '<aside><slot /></aside>' },
          RouterView: { template: '<div data-test="router-view" />' },
          'router-view': { template: '<div data-test="router-view" />' },
          Transition: false,
        },
      },
    })

    expect(wrapper.find('[data-test="action-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="desktop-sidebar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
  })

  it('opens the collapsed floating navigation menu', async () => {
    const { wrapper } = await shallowMountWithPlugins(DesktopLayout, {
      routes,
      initialPath: '/desktop',
      global: {
        stubs: {
          ActionBar: true,
          'action-bar': true,
          DesktopSidebar: true,
          'desktop-sidebar': true,
          NLayout: { template: '<main><slot /></main>' },
          'n-layout': { template: '<main><slot /></main>' },
          Layout: { template: '<main><slot /></main>' },
          NLayoutSider: {
            emits: ['collapse'],
            template: '<aside><button data-test="collapse" @click="$emit(\'collapse\')">collapse</button><slot /></aside>',
          },
          'n-layout-sider': {
            emits: ['collapse'],
            template: '<aside><button data-test="collapse" @click="$emit(\'collapse\')">collapse</button><slot /></aside>',
          },
          LayoutSider: {
            emits: ['collapse'],
            template: '<aside><button data-test="collapse" @click="$emit(\'collapse\')">collapse</button><slot /></aside>',
          },
          RouterView: true,
          'router-view': true,
          Transition: false,
        },
      },
    })

    await wrapper.find('[data-test="collapse"]').trigger('click')
    expect(wrapper.find('.fab-main').exists()).toBe(true)

    await wrapper.find('.fab-main').trigger('click')
    expect(wrapper.find('.fab-menu').exists()).toBe(true)
  })
})
