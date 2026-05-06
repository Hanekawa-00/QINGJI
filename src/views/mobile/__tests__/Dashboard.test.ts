import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MobileDashboard from '../Dashboard.vue'
import { mountWithPlugins } from '@/test/test-utils'

const routes = [
  { path: '/mobile', name: 'MobileDashboard', component: MobileDashboard },
  { path: '/mobile/calendar', name: 'MobileCalendar', component: { template: '<div>Calendar</div>' } },
  { path: '/mobile/reports', name: 'MobileReports', component: { template: '<div>Reports</div>' } },
  { path: '/mobile/entry', name: 'MobileEntry', component: { template: '<div>Entry</div>' } },
  { path: '/mobile/settings', name: 'MobileSettings', component: { template: '<div>Settings</div>' } },
]

describe('MobileDashboard', () => {
  it('renders mobile dashboard summary and primary action', async () => {
    const { wrapper } = await mountWithPlugins(MobileDashboard, {
      routes,
      initialPath: '/mobile',
      global: {
        stubs: {
          BarLineChart: { template: '<div data-test="chart" />' },
          TransactionItem: { props: ['transaction'], template: '<article>{{ transaction.description }}</article>' },
          YearMonthPicker: true,
          VanEmpty: { template: '<div data-test="empty" />' },
          VanActionSheet: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Current Balance')
    expect(wrapper.text()).toContain('Monthly Income')
    expect(wrapper.text()).toContain('Monthly Spending')
    expect(wrapper.find('.fab-button').exists()).toBe(true)
  })

  it('navigates through mobile header and floating action buttons', async () => {
    const { wrapper, router } = await mountWithPlugins(MobileDashboard, {
      routes,
      initialPath: '/mobile',
      global: {
        stubs: {
          BarLineChart: true,
          TransactionItem: true,
          YearMonthPicker: true,
          VanEmpty: true,
          VanActionSheet: true,
        },
      },
    })

    await wrapper.find('.fab-button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('MobileEntry')

    await router.push('/mobile')
    await wrapper.find('.header-left .nav-btn').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('MobileSettings')
  })
})
