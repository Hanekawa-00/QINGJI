/**
 * 图表数据组合式函数
 * 可跨平台复用（桌面端/移动端）
 */

import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { formatDateISO } from './useFormatters'

export type ChartPeriod = 'week' | '7days' | '15days'
export type ChartDisplayType = 'expense' | 'both'

export interface ChartBarData {
  date: string
  label: string
  income: number
  expense: number
  incomePercent: number
  expensePercent: number
}

export interface UseChartDataOptions {
  defaultPeriod?: ChartPeriod
  defaultType?: ChartDisplayType
}

export function useChartData(options: UseChartDataOptions = {}) {
  const userStore = useUserStore()
  
  const chartPeriod = ref<ChartPeriod>(options.defaultPeriod || 'week')
  const chartType = ref<ChartDisplayType>(options.defaultType || 'expense')
  const hoveredBarIndex = ref<number | null>(null)

  // 时间范围选项
  const periodOptions = [
    { label: 'This Week', value: 'week' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 15 Days', value: '15days' }
  ]

  // 图表数据计算
  const chartData = computed((): ChartBarData[] => {
    const now = new Date()
    const today = now.getDay() // 0 = Sunday
    const data: ChartBarData[] = []
    
    let days: number
    let startOffset: number
    
    if (chartPeriod.value === 'week') {
      days = 7
      startOffset = -((today + 6) % 7) // 周一为起点
    } else if (chartPeriod.value === '7days') {
      days = 7
      startOffset = -6
    } else {
      days = 15
      startOffset = -14
    }
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + startOffset + i)
      const dateStr = formatDateISO(date)
      
      const dayIncome = userStore.transactions
        .filter(t => t.date === dateStr && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const dayExpense = userStore.transactions
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      // 格式化标签
      let label: string
      if (chartPeriod.value === 'week') {
        label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      } else {
        label = `${date.getMonth() + 1}/${date.getDate()}`
      }
      
      data.push({
        date: dateStr,
        label,
        income: dayIncome,
        expense: dayExpense,
        incomePercent: 0,
        expensePercent: 0
      })
    }
    
    // 计算百分比
    const maxIncome = Math.max(...data.map(d => d.income), 1)
    const maxExpense = Math.max(...data.map(d => d.expense), 1)
    const maxValue = chartType.value === 'both' 
      ? Math.max(maxIncome, maxExpense) 
      : maxExpense
    
    data.forEach(d => {
      d.incomePercent = Math.round((d.income / maxValue) * 100) || 0
      d.expensePercent = Math.round((d.expense / maxValue) * 100) || 0
    })
    
    return data
  })

  return {
    chartPeriod,
    chartType,
    hoveredBarIndex,
    periodOptions,
    chartData
  }
}
