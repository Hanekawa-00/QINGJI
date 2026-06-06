import { defineComponent, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountWithPlugins } from '@/test/test-utils'
import { useUserStore } from '@/stores/user.store'
import { useChartData } from '../useChartData'

const ChartHarness = defineComponent({
  setup(_, { expose }) {
    const chart = useChartData({
      defaultPeriod: '7days',
      defaultType: 'both',
    })

    expose(chart)
    return () => null
  },
})

describe('useChartData', () => {
  it('recomputes chart totals after a transaction is added', async () => {
    vi.setSystemTime(new Date('2024-05-15T12:00:00.000Z'))

    const { wrapper } = await mountWithPlugins(ChartHarness)
    const userStore = useUserStore()
    userStore.transactions = []

    await userStore.addTransaction({
      type: 'expense',
      amount: 25,
      currency: 'USD',
      convertedAmount: 25,
      exchangeRate: 1,
      category: 'Food',
      categoryIcon: 'restaurant',
      description: 'Lunch',
      date: '2024-05-15',
    })
    await nextTick()

    const chartData = (wrapper.vm as any).chartData
    const today = chartData.find((item: { date: string }) => item.date === '2024-05-15')

    expect(today?.expense).toBe(25)
    expect(chartData.reduce((sum: number, item: { expense: number }) => sum + item.expense, 0)).toBe(25)
  })
})
