/**
 * 用户数据状态管理
 * 业务逻辑 100% 跨平台共享
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, Category, Statistics, CategoryReport, DailyReport, PeriodStatistics, ReportPeriod } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 交易记录
  const transactions = ref<Transaction[]>([
    // 2024年11月数据（用于对比）
    {
      id: 'nov-1',
      type: 'expense',
      amount: 15.50,
      category: 'Food & Drink',
      categoryIcon: 'local_cafe',
      description: 'Cafe Latte',
      date: '2024-11-30',
      createdAt: '2024-11-30T10:30:00',
      updatedAt: '2024-11-30T10:30:00'
    },
    {
      id: 'nov-2',
      type: 'expense',
      amount: 17.50,
      category: 'Food & Drink',
      categoryIcon: 'restaurant',
      description: 'Lunch',
      date: '2024-11-14',
      createdAt: '2024-11-14T12:30:00',
      updatedAt: '2024-11-14T12:30:00'
    },
    // 2024年12月数据（当前月）
    {
      id: 'dec-1',
      type: 'income',
      amount: 2900.00,
      category: 'Income',
      categoryIcon: 'receipt_long',
      description: 'Monthly Salary',
      date: '2024-12-01',
      createdAt: '2024-12-01T09:00:00',
      updatedAt: '2024-12-01T09:00:00'
    },
    {
      id: 'dec-2',
      type: 'expense',
      amount: 8.50,
      category: 'Food & Drink',
      categoryIcon: 'local_cafe',
      description: 'Coffee',
      date: '2024-12-02',
      createdAt: '2024-12-02T08:30:00',
      updatedAt: '2024-12-02T08:30:00'
    },
    {
      id: 'dec-3',
      type: 'expense',
      amount: 45.00,
      category: 'Transport',
      categoryIcon: 'directions_car',
      description: 'Gas',
      date: '2024-12-03',
      createdAt: '2024-12-03T17:00:00',
      updatedAt: '2024-12-03T17:00:00'
    },
    {
      id: 'dec-4',
      type: 'expense',
      amount: 120.00,
      category: 'Shopping',
      categoryIcon: 'shopping_cart',
      description: 'Groceries',
      date: '2024-12-05',
      createdAt: '2024-12-05T14:20:00',
      updatedAt: '2024-12-05T14:20:00'
    },
    {
      id: 'dec-5',
      type: 'expense',
      amount: 25.00,
      category: 'Food & Drink',
      categoryIcon: 'restaurant',
      description: 'Dinner',
      date: '2024-12-07',
      createdAt: '2024-12-07T19:30:00',
      updatedAt: '2024-12-07T19:30:00'
    },
    {
      id: 'dec-6',
      type: 'expense',
      amount: 15.00,
      category: 'Transport',
      categoryIcon: 'directions_car',
      description: 'Parking',
      date: '2024-12-09',
      createdAt: '2024-12-09T10:00:00',
      updatedAt: '2024-12-09T10:00:00'
    },
    {
      id: 'dec-7',
      type: 'expense',
      amount: 89.99,
      category: 'Shopping',
      categoryIcon: 'shopping_cart',
      description: 'Amazon Purchase',
      date: '2024-12-10',
      createdAt: '2024-12-10T14:20:00',
      updatedAt: '2024-12-10T14:20:00'
    },
    {
      id: 'dec-8',
      type: 'expense',
      amount: 12.50,
      category: 'Food & Drink',
      categoryIcon: 'local_cafe',
      description: 'Brunch',
      date: '2024-12-12',
      createdAt: '2024-12-12T11:00:00',
      updatedAt: '2024-12-12T11:00:00'
    },
    {
      id: 'dec-9',
      type: 'expense',
      amount: 35.00,
      category: 'Transport',
      categoryIcon: 'directions_car',
      description: 'Gas',
      date: '2024-12-15',
      createdAt: '2024-12-15T16:30:00',
      updatedAt: '2024-12-15T16:30:00'
    },
    {
      id: 'dec-10',
      type: 'expense',
      amount: 65.00,
      category: 'Shopping',
      categoryIcon: 'shopping_cart',
      description: 'Clothing',
      date: '2024-12-18',
      createdAt: '2024-12-18T13:00:00',
      updatedAt: '2024-12-18T13:00:00'
    },
    {
      id: 'dec-11',
      type: 'expense',
      amount: 18.00,
      category: 'Food & Drink',
      categoryIcon: 'restaurant',
      description: 'Lunch',
      date: '2024-12-20',
      createdAt: '2024-12-20T12:30:00',
      updatedAt: '2024-12-20T12:30:00'
    },
    {
      id: 'dec-12',
      type: 'expense',
      amount: 50.00,
      category: 'Shopping',
      categoryIcon: 'shopping_cart',
      description: 'Books',
      date: '2024-12-22',
      createdAt: '2024-12-22T15:00:00',
      updatedAt: '2024-12-22T15:00:00'
    },
    {
      id: 'dec-13',
      type: 'expense',
      amount: 22.00,
      category: 'Food & Drink',
      categoryIcon: 'restaurant',
      description: 'Dinner',
      date: '2024-12-25',
      createdAt: '2024-12-25T19:00:00',
      updatedAt: '2024-12-25T19:00:00'
    },
    {
      id: 'dec-14',
      type: 'expense',
      amount: 30.00,
      category: 'Transport',
      categoryIcon: 'directions_car',
      description: 'Car Wash',
      date: '2024-12-28',
      createdAt: '2024-12-28T10:00:00',
      updatedAt: '2024-12-28T10:00:00'
    }
  ])

  // 分类列表
  const categories = ref<Category[]>([
    { id: '1', name: 'Food & Drink', icon: 'local_cafe', type: 'expense', color: '#36a2e8' },
    { id: '2', name: 'Shopping', icon: 'shopping_cart', type: 'expense', color: '#f6b756' },
    { id: '3', name: 'Transport', icon: 'directions_car', type: 'expense', color: '#ef5f9a' },
    { id: '4', name: 'Income', icon: 'receipt_long', type: 'income', color: '#2bd776' }
  ])

  /**
   * 计算总余额
   */
  const totalBalance = computed(() => {
    return transactions.value.reduce((total, t) => {
      return t.type === 'income' ? total + t.amount : total - t.amount
    }, 0)
  })

  /**
   * 计算当月收入
   */
  const monthlyIncome = computed(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return transactions.value
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'income' 
          && date.getMonth() === currentMonth 
          && date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + t.amount, 0)
  })

  /**
   * 计算当月支出
   */
  const monthlyExpense = computed(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return transactions.value
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'expense' 
          && date.getMonth() === currentMonth 
          && date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + t.amount, 0)
  })

  /**
   * 本周活动数据（7天）
   */
  const weeklyActivity = computed(() => {
    // 模拟数据：7天的支出金额百分比
    return [40, 70, 90, 60, 20, 30, 50]
  })

  /**
   * 最近的交易记录
   */
  const recentTransactions = computed(() => {
    return [...transactions.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  })

  /**
   * 统计数据
   */
  const statistics = computed<Statistics>(() => ({
    totalBalance: totalBalance.value,
    monthlyIncome: monthlyIncome.value,
    monthlyExpense: monthlyExpense.value,
    weeklyActivity: weeklyActivity.value,
    dailyAverage: monthlyExpense.value / 30
  }))

  /**
   * 添加交易记录
   */
  function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    }
    transactions.value.unshift(newTransaction)
  }

  /**
   * 删除交易记录
   */
  function deleteTransaction(id: string) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
    }
  }

  /**
   * 更新交易记录
   */
  function updateTransaction(id: string, updates: Partial<Transaction>) {
    const transaction = transactions.value.find(t => t.id === id)
    if (transaction) {
      Object.assign(transaction, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    }
  }

  /**
   * 计算指定期间的统计数据
   */
  function getPeriodStatistics(period: ReportPeriod, year: number, month?: number): PeriodStatistics {
    // 筛选当前期间的交易
    const currentTransactions = transactions.value.filter(t => {
      const date = new Date(t.date)
      const tYear = date.getFullYear()
      const tMonth = date.getMonth()
      
      if (period === 'month') {
        return tYear === year && tMonth === (month ?? 0)
      } else {
        return tYear === year
      }
    })

    // 筛选上期交易（用于计算变化）
    const previousTransactions = transactions.value.filter(t => {
      const date = new Date(t.date)
      const tYear = date.getFullYear()
      const tMonth = date.getMonth()
      
      if (period === 'month') {
        const prevMonth = (month ?? 0) - 1
        const prevYear = prevMonth < 0 ? year - 1 : year
        const adjustedMonth = prevMonth < 0 ? 11 : prevMonth
        return tYear === prevYear && tMonth === adjustedMonth
      } else {
        return tYear === year - 1
      }
    })

    // 计算总收入和总支出
    const totalIncome = currentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = currentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const previousExpense = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // 计算支出变化百分比
    const expenseChange = previousExpense === 0 ? 0 : 
      ((totalExpense - previousExpense) / previousExpense) * 100

    // 计算平均每日支出
    const daysInPeriod = period === 'month' ? 30 : 365
    const avgDailyExpense = totalExpense / daysInPeriod

    // 计算分类报告
    const categoryMap = new Map<string, CategoryReport>()
    
    currentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = categories.value.find(c => c.name === t.category)
        if (!category) return

        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon,
            categoryColor: category.color,
            totalAmount: 0,
            percentage: 0,
            change: 0,
            changePercentage: 0,
            transactionCount: 0
          })
        }

        const report = categoryMap.get(category.id)!
        report.totalAmount += t.amount
        report.transactionCount += 1
      })

    // 计算上期各分类的支出
    const previousCategoryMap = new Map<string, number>()
    previousTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = categories.value.find(c => c.name === t.category)
        if (!category) return
        
        const current = previousCategoryMap.get(category.id) || 0
        previousCategoryMap.set(category.id, current + t.amount)
      })

    // 计算百分比和变化
    const categoryReports = Array.from(categoryMap.values()).map(report => {
      report.percentage = totalExpense === 0 ? 0 : (report.totalAmount / totalExpense) * 100
      
      const previousAmount = previousCategoryMap.get(report.categoryId) || 0
      report.change = report.totalAmount - previousAmount
      report.changePercentage = previousAmount === 0 ? 0 : 
        ((report.totalAmount - previousAmount) / previousAmount) * 100
      
      return report
    }).sort((a, b) => b.totalAmount - a.totalAmount)

    // 计算每日报告
    const dailyMap = new Map<string, DailyReport>()
    
    currentTransactions.forEach(t => {
      if (!dailyMap.has(t.date)) {
        dailyMap.set(t.date, {
          date: t.date,
          income: 0,
          expense: 0,
          balance: 0
        })
      }

      const report = dailyMap.get(t.date)!
      if (t.type === 'income') {
        report.income += t.amount
      } else {
        report.expense += t.amount
      }
      report.balance = report.income - report.expense
    })

    const dailyReports = Array.from(dailyMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 生成每日统计数据（用于柱状图）
    const dailyStats: number[] = []
    const daysCount = period === 'month' ? 30 : 12 // 月份显示30天，年份显示12个月
    
    if (period === 'month') {
      // 按日统计
      for (let day = 1; day <= daysCount; day++) {
        const dateStr = `${year}-${String((month ?? 0) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = dailyMap.get(dateStr)
        dailyStats.push(dayData?.expense || 0)
      }
    } else {
      // 按月统计
      for (let m = 0; m < 12; m++) {
        const monthExpense = currentTransactions
          .filter(t => {
            const date = new Date(t.date)
            return t.type === 'expense' && date.getMonth() === m
          })
          .reduce((sum, t) => sum + t.amount, 0)
        dailyStats.push(monthExpense)
      }
    }

    return {
      period,
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      avgDailyExpense,
      expenseChange,
      categoryReports,
      dailyReports,
      dailyStats
    }
  }

  return {
    // 状态
    transactions,
    categories,
    
    // 计算属性
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    weeklyActivity,
    recentTransactions,
    statistics,
    
    // 方法
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getPeriodStatistics
  }
})
