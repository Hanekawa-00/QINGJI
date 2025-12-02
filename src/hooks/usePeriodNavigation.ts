/**
 * 期间导航 Composable
 * 用于月份/年份选择和导航
 * 可跨平台复用（桌面端/移动端）
 */

import { ref, computed } from 'vue'
import type { ReportPeriod } from '@/types'

export interface UsePeriodNavigationOptions {
  initialYear?: number
  initialMonth?: number
  initialPeriod?: ReportPeriod
}

export function usePeriodNavigation(options: UsePeriodNavigationOptions = {}) {
  const currentDate = new Date()
  
  const selectedYear = ref(options.initialYear ?? currentDate.getFullYear())
  const selectedMonth = ref(options.initialMonth ?? currentDate.getMonth())
  const selectedPeriod = ref<ReportPeriod>(options.initialPeriod ?? 'month')
  
  // 期间选择器时间戳（用于与 MonthYearPicker 组件配合）
  const periodPickerTimestamp = computed({
    get: () => new Date(selectedYear.value, selectedMonth.value, 1).getTime(),
    set: (val: number) => {
      const date = new Date(val)
      selectedYear.value = date.getFullYear()
      selectedMonth.value = date.getMonth()
    }
  })
  
  // 年份选择器选项
  const yearOptions = computed(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => ({
      label: String(current - 5 + i),
      value: current - 5 + i
    }))
  })
  
  // 月份选择器选项
  const monthOptions = computed(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((label, value) => ({ label, value }))
  })
  
  // 期间类型选项
  const periodOptions = [
    { label: 'Monthly', value: 'month' as ReportPeriod },
    { label: 'Yearly', value: 'year' as ReportPeriod }
  ]
  
  // 当前期间显示文本
  const periodDisplayText = computed(() => {
    if (selectedPeriod.value === 'year') {
      return String(selectedYear.value)
    }
    const date = new Date(selectedYear.value, selectedMonth.value)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  })
  
  // 是否为当前期间
  const isCurrentPeriod = computed(() => {
    const now = new Date()
    if (selectedPeriod.value === 'year') {
      return selectedYear.value === now.getFullYear()
    }
    return selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth()
  })
  
  // 切换到上一期间
  const goToPrevious = () => {
    if (selectedPeriod.value === 'month') {
      if (selectedMonth.value === 0) {
        selectedMonth.value = 11
        selectedYear.value--
      } else {
        selectedMonth.value--
      }
    } else {
      selectedYear.value--
    }
  }
  
  // 切换到下一期间
  const goToNext = () => {
    if (selectedPeriod.value === 'month') {
      if (selectedMonth.value === 11) {
        selectedMonth.value = 0
        selectedYear.value++
      } else {
        selectedMonth.value++
      }
    } else {
      selectedYear.value++
    }
  }
  
  // 跳转到当前期间
  const goToCurrent = () => {
    const now = new Date()
    selectedYear.value = now.getFullYear()
    selectedMonth.value = now.getMonth()
  }
  
  // 设置期间类型
  const setPeriod = (period: ReportPeriod) => {
    selectedPeriod.value = period
  }
  
  // 格式化变化百分比
  const formatChangePercentage = (value: number) => {
    const sign = value >= 0 ? '↑' : '↓'
    return `${sign} ${Math.abs(value).toFixed(1)}%`
  }
  
  return {
    // 状态
    selectedYear,
    selectedMonth,
    selectedPeriod,
    periodPickerTimestamp,
    
    // 选项
    yearOptions,
    monthOptions,
    periodOptions,
    
    // 计算属性
    periodDisplayText,
    isCurrentPeriod,
    
    // 方法
    goToPrevious,
    goToNext,
    goToCurrent,
    setPeriod,
    formatChangePercentage
  }
}
