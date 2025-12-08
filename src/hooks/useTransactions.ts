/**
 * 交易数据组合式函数
 * 可跨平台复用（桌面端/移动端）
 */

import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user.store'
import type { Transaction } from '@/types'

export interface GroupedTransactions {
  date: string
  dateDisplay: string
  transactions: Transaction[]
  dayIncome: number
  dayExpense: number
}

/**
 * 获取指定月份的交易记录
 */
export function useMonthlyTransactions(timestampRef: Ref<number>) {
  const userStore = useUserStore()

  const monthlyTransactions = computed(() => {
    const date = new Date(timestampRef.value)
    const year = date.getFullYear()
    const month = date.getMonth()
    
    return userStore.transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getFullYear() === year && tDate.getMonth() === month
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  return monthlyTransactions
}

/**
 * 按日期分组交易记录
 */
export function useGroupedTransactions(transactions: Ref<Transaction[]>) {
  const { locale } = useI18n()
  
  return computed((): GroupedTransactions[] => {
    const groups: Record<string, GroupedTransactions> = {}
    // 根据当前语言选择日期格式化的 locale
    const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
    
    transactions.value.forEach(t => {
      if (!groups[t.date]) {
        const date = new Date(t.date)
        groups[t.date] = {
          date: t.date,
          dateDisplay: date.toLocaleDateString(dateLocale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          transactions: [],
          dayIncome: 0,
          dayExpense: 0
        }
      }
      groups[t.date].transactions.push(t)
      // 使用转换后的金额计算日汇总（主币种）
      const amount = t.convertedAmount ?? t.amount
      if (t.type === 'income') {
        groups[t.date].dayIncome += amount
      } else {
        groups[t.date].dayExpense += amount
      }
    })
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })
}

/**
 * 月度统计数据
 */
export interface MonthlyStats {
  income: number
  expense: number
  balance: number
}

/**
 * 获取指定月份的统计数据
 */
export function useMonthlyStats(timestampRef: Ref<number>) {
  const monthlyTransactions = useMonthlyTransactions(timestampRef)

  return computed<MonthlyStats>(() => {
    let income = 0
    let expense = 0

    monthlyTransactions.value.forEach(t => {
      const amount = t.convertedAmount ?? t.amount
      if (t.type === 'income') {
        income += amount
      } else {
        expense += amount
      }
    })

    return {
      income,
      expense,
      balance: income - expense
    }
  })
}

/**
 * 交易数据组合式函数
 */
export function useTransactions(timestampRef: Ref<number>) {
  const monthlyTransactions = useMonthlyTransactions(timestampRef)
  const groupedTransactions = useGroupedTransactions(monthlyTransactions)
  const monthlyStats = useMonthlyStats(timestampRef)

  return {
    monthlyTransactions,
    groupedTransactions,
    monthlyStats
  }
}
