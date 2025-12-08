/**
 * 日历数据生成 Composable
 * 可跨平台复用（桌面端/移动端）
 */

import { ref, computed, type Ref } from 'vue'
import type { Transaction, CalendarDay, MonthCalendar } from '@/types'

export interface UseCalendarOptions {
  transactions: Ref<Transaction[]>
  initialYear?: number
  initialMonth?: number
}

export function useCalendar(options: UseCalendarOptions) {
  const { transactions, initialYear, initialMonth } = options
  
  const currentDate = new Date()
  const selectedYear = ref(initialYear ?? currentDate.getFullYear())
  const selectedMonth = ref(initialMonth ?? currentDate.getMonth())
  const selectedDate = ref(currentDate.toISOString().split('T')[0])

  // 星期标签
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekDaysCN = ['日', '一', '二', '三', '四', '五', '六']

  // 月份选择器时间戳（用于与 MonthYearPicker 组件配合）
  const monthPickerTimestamp = computed({
    get: () => new Date(selectedYear.value, selectedMonth.value, 1).getTime(),
    set: (val: number) => {
      const date = new Date(val)
      selectedYear.value = date.getFullYear()
      selectedMonth.value = date.getMonth()
    }
  })

  // 格式化日期显示
  const monthYearDisplay = computed(() => {
    const date = new Date(selectedYear.value, selectedMonth.value)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' })
  })

  // 生成日历数据
  const calendarData = computed<MonthCalendar>(() => {
    const year = selectedYear.value
    const month = selectedMonth.value
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 获取第一天是星期几（0-6）
    const firstDayOfWeek = firstDay.getDay()
    
    // 生成日历数组（6周 * 7天 = 42天）
    const days: CalendarDay[] = []
    const today = new Date().toISOString().split('T')[0]
    
    // 填充上月的日期
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        income: 0,
        expense: 0,
        transactions: []
      })
    }
    
    // 填充当月的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // 获取该日的交易
      const dayTransactions = transactions.value.filter(t => t.date === dateStr)
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.convertedAmount ?? t.amount), 0)
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.convertedAmount ?? t.amount), 0)
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate.value,
        income,
        expense,
        transactions: dayTransactions
      })
    }
    
    // 填充下月的日期
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        income: 0,
        expense: 0,
        transactions: []
      })
    }
    
    // 计算本月统计
    const currentMonthDays = days.filter(d => d.isCurrentMonth)
    const totalIncome = currentMonthDays.reduce((sum, d) => sum + d.income, 0)
    const totalExpense = currentMonthDays.reduce((sum, d) => sum + d.expense, 0)
    
    return {
      year,
      month,
      days,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  })

  // 选中日期的数据
  const selectedDayData = computed(() => {
    return calendarData.value.days.find(d => d.date === selectedDate.value)
  })

  // 选中日期的显示文本
  const selectedDateDisplay = computed(() => {
    if (!selectedDayData.value) return ''
    const date = new Date(selectedDate.value)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${dayNames[date.getDay()]}`
  })

  // 点击日期
  const selectDate = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      selectedDate.value = day.date
    }
  }

  // 上一月
  const goToPreviousMonth = () => {
    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  }

  // 下一月
  const goToNextMonth = () => {
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  }

  // 跳转到今天
  const goToToday = () => {
    const today = new Date()
    selectedYear.value = today.getFullYear()
    selectedMonth.value = today.getMonth()
    selectedDate.value = today.toISOString().split('T')[0]
  }

  return {
    // 状态
    selectedYear,
    selectedMonth,
    selectedDate,
    monthPickerTimestamp,
    
    // 常量
    weekDays,
    weekDaysCN,
    
    // 计算属性
    monthYearDisplay,
    calendarData,
    selectedDayData,
    selectedDateDisplay,
    
    // 方法
    selectDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  }
}
