/**
 * 用户数据状态管理
 * 业务逻辑 100% 跨平台共享
 * 支持 SQLite 数据库持久化
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, Category, Statistics, CategoryReport, DailyReport, PeriodStatistics, ReportPeriod } from '@/types'
import * as db from '@/services/database'

export const useUserStore = defineStore('user', () => {
  // 数据库初始化状态
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const dbError = ref<string | null>(null)
  // 生成模拟数据的辅助函数
  const generateMockData = (): Transaction[] => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()
    
    const data: Transaction[] = []
    
    // 上月数据（用于对比）
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthDays = new Date(lastMonthYear, lastMonth + 1, 0).getDate()
    
    // 上月收入
    data.push({
      id: 'lm-salary',
      type: 'income',
      amount: 5200.00,
      category: 'Income',
      categoryIcon: 'receipt_long',
      description: 'Monthly Salary',
      date: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`,
      createdAt: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01T09:00:00`,
      updatedAt: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01T09:00:00`
    })
    
    // 上月支出 (随机分布)
    const lastMonthExpenses = [
      { day: 3, amount: 45.50, cat: 'Food & Drink', icon: 'restaurant', desc: 'Family Dinner' },
      { day: 5, amount: 68.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' },
      { day: 8, amount: 156.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Groceries' },
      { day: 12, amount: 28.50, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee & Snacks' },
      { day: 15, amount: 89.99, cat: 'Shopping', icon: 'shopping_cart', desc: 'Electronics' },
      { day: 18, amount: 35.00, cat: 'Transport', icon: 'directions_car', desc: 'Parking Fee' },
      { day: 22, amount: 42.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Lunch Meeting' },
      { day: 25, amount: 120.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Clothing' },
      { day: 28, amount: 55.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' }
    ]
    
    lastMonthExpenses.forEach((exp, idx) => {
      if (exp.day <= lastMonthDays) {
        data.push({
          id: `lm-${idx}`,
          type: 'expense',
          amount: exp.amount,
          category: exp.cat,
          categoryIcon: exp.icon,
          description: exp.desc,
          date: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}`,
          createdAt: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}T${10 + idx}:00:00`,
          updatedAt: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}T${10 + idx}:00:00`
        })
      }
    })
    
    // 本月收入
    data.push({
      id: 'cm-salary',
      type: 'income',
      amount: 5200.00,
      category: 'Income',
      categoryIcon: 'receipt_long',
      description: 'Monthly Salary',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
      createdAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01T09:00:00`,
      updatedAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01T09:00:00`
    })
    
    // 本月额外收入
    if (currentDay >= 15) {
      data.push({
        id: 'cm-bonus',
        type: 'income',
        amount: 800.00,
        category: 'Income',
        categoryIcon: 'receipt_long',
        description: 'Project Bonus',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
        createdAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15T14:00:00`,
        updatedAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15T14:00:00`
      })
    }
    
    // 本月支出 (根据当前日期动态生成)
    const currentMonthExpenses = [
      { day: 1, amount: 8.50, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Morning Coffee' },
      { day: 1, amount: 25.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Dinner' },
      { day: 2, amount: 45.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' },
      { day: 2, amount: 22.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Lunch' },
      { day: 3, amount: 135.50, cat: 'Shopping', icon: 'shopping_cart', desc: 'Groceries' },
      { day: 4, amount: 12.00, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee' },
      { day: 5, amount: 68.99, cat: 'Shopping', icon: 'shopping_cart', desc: 'Home Supplies' },
      { day: 6, amount: 38.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Weekend Brunch' },
      { day: 7, amount: 15.00, cat: 'Transport', icon: 'directions_car', desc: 'Parking' },
      { day: 8, amount: 28.50, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee & Pastry' },
      { day: 9, amount: 89.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Books' },
      { day: 10, amount: 42.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Business Lunch' },
      { day: 11, amount: 55.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' },
      { day: 12, amount: 18.50, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Afternoon Tea' },
      { day: 13, amount: 156.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Clothing' },
      { day: 14, amount: 32.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Dinner Date' },
      { day: 15, amount: 25.00, cat: 'Transport', icon: 'directions_car', desc: 'Car Wash' },
      { day: 16, amount: 9.50, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee' },
      { day: 17, amount: 78.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Electronics Accessories' },
      { day: 18, amount: 45.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Family Dinner' },
      { day: 19, amount: 62.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' },
      { day: 20, amount: 15.00, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee Meeting' },
      { day: 21, amount: 198.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Gift Shopping' },
      { day: 22, amount: 35.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Lunch' },
      { day: 23, amount: 20.00, cat: 'Transport', icon: 'directions_car', desc: 'Parking' },
      { day: 24, amount: 125.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Groceries' },
      { day: 25, amount: 55.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Holiday Dinner' },
      { day: 26, amount: 48.00, cat: 'Transport', icon: 'directions_car', desc: 'Gas' },
      { day: 27, amount: 85.00, cat: 'Shopping', icon: 'shopping_cart', desc: 'Home Decor' },
      { day: 28, amount: 22.00, cat: 'Food & Drink', icon: 'local_cafe', desc: 'Coffee & Snacks' },
      { day: 29, amount: 30.00, cat: 'Transport', icon: 'directions_car', desc: 'Toll Fee' },
      { day: 30, amount: 42.00, cat: 'Food & Drink', icon: 'restaurant', desc: 'Dinner' }
    ]
    
    currentMonthExpenses.forEach((exp, idx) => {
      if (exp.day <= currentDay) {
        data.push({
          id: `cm-${idx}`,
          type: 'expense',
          amount: exp.amount,
          category: exp.cat,
          categoryIcon: exp.icon,
          description: exp.desc,
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}`,
          createdAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}T${8 + (idx % 12)}:${(idx * 7) % 60}:00`,
          updatedAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}T${8 + (idx % 12)}:${(idx * 7) % 60}:00`
        })
      }
    })
    
    return data
  }

  // 交易记录
  const transactions = ref<Transaction[]>(generateMockData())

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
   * 本周每日支出数据（7天，基于真实交易）
   */
  const weeklyExpenses = computed(() => {
    const now = new Date()
    const today = now.getDay() // 0 = Sunday
    
    // 获取本周每天的支出金额
    const dailyExpenses: number[] = []
    
    for (let i = 0; i < 7; i++) {
      // 计算每天的日期 (Mon=0 to Sun=6)
      const dayOffset = i - ((today + 6) % 7) // 将周一作为起点
      const date = new Date(now)
      date.setDate(now.getDate() + dayOffset)
      const dateStr = date.toISOString().split('T')[0]
      
      // 计算该天的支出
      const dayExpense = transactions.value
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      dailyExpenses.push(dayExpense)
    }
    
    return dailyExpenses
  })

  /**
   * 本周活动百分比（用于柱状图）
   */
  const weeklyActivity = computed(() => {
    const expenses = weeklyExpenses.value
    if (!expenses || expenses.length === 0) return [0, 0, 0, 0, 0, 0, 0]
    const maxExpense = Math.max(...expenses, 1)
    return expenses.map(exp => Math.round((exp / maxExpense) * 100) || 0)
  })

  /**
   * 本周总支出
   */
  const weeklyTotal = computed(() => {
    const expenses = weeklyExpenses.value
    if (!expenses || expenses.length === 0) return 0
    return expenses.reduce((sum, exp) => sum + (exp || 0), 0)
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
    weeklyTotal: weeklyTotal.value,
    dailyAverage: monthlyExpense.value / 30
  }))

  /**
   * 添加交易记录
   */
  async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    
    // 如果在 Tauri 环境，保存到数据库
    if (isInitialized.value) {
      try {
        const id = await db.addTransaction(transaction)
        const newTransaction: Transaction = {
          ...transaction,
          id,
          createdAt: now,
          updatedAt: now
        }
        transactions.value.unshift(newTransaction)
        return id
      } catch (error) {
        console.error('Failed to save transaction to database:', error)
        dbError.value = String(error)
      }
    }
    
    // 回退到内存存储
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    transactions.value.unshift(newTransaction)
    return newTransaction.id
  }

  /**
   * 删除交易记录
   */
  async function deleteTransaction(id: string) {
    // 如果在 Tauri 环境，从数据库删除
    if (isInitialized.value) {
      try {
        await db.deleteTransaction(id)
      } catch (error) {
        console.error('Failed to delete transaction from database:', error)
        dbError.value = String(error)
      }
    }
    
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
    }
  }

  /**
   * 更新交易记录
   */
  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    // 如果在 Tauri 环境，更新数据库
    if (isInitialized.value) {
      try {
        await db.updateTransaction(id, updates)
      } catch (error) {
        console.error('Failed to update transaction in database:', error)
        dbError.value = String(error)
      }
    }
    
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

    // 通用分类报告计算函数
    const buildCategoryReports = (type: 'expense' | 'income') => {
      const categoryMap = new Map<string, CategoryReport>()
      const total = type === 'expense' ? totalExpense : totalIncome
      
      currentTransactions
        .filter(t => t.type === type)
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

      // 计算上期各分类的金额
      const previousCategoryMap = new Map<string, number>()
      previousTransactions
        .filter(t => t.type === type)
        .forEach(t => {
          const category = categories.value.find(c => c.name === t.category)
          if (!category) return
          
          const current = previousCategoryMap.get(category.id) || 0
          previousCategoryMap.set(category.id, current + t.amount)
        })

      // 计算百分比和变化
      return Array.from(categoryMap.values()).map(report => {
        report.percentage = total === 0 ? 0 : (report.totalAmount / total) * 100
        
        const previousAmount = previousCategoryMap.get(report.categoryId) || 0
        report.change = report.totalAmount - previousAmount
        report.changePercentage = previousAmount === 0 ? 0 : 
          ((report.totalAmount - previousAmount) / previousAmount) * 100
        
        return report
      }).sort((a, b) => b.totalAmount - a.totalAmount)
    }

    const expenseCategoryReports = buildCategoryReports('expense')
    const incomeCategoryReports = buildCategoryReports('income')

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

    // 生成每日/月度统计数据（用于柱状图）
    const expenseStats: number[] = []
    const incomeStats: number[] = []
    
    if (period === 'month') {
      // 按日统计
      const daysInMonth = new Date(year, (month ?? 0) + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String((month ?? 0) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = dailyMap.get(dateStr)
        expenseStats.push(dayData?.expense || 0)
        incomeStats.push(dayData?.income || 0)
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
        const monthIncome = currentTransactions
          .filter(t => {
            const date = new Date(t.date)
            return t.type === 'income' && date.getMonth() === m
          })
          .reduce((sum, t) => sum + t.amount, 0)
        expenseStats.push(monthExpense)
        incomeStats.push(monthIncome)
      }
    }

    // 生成月度报告（用于年度报表底部表格）
    const monthlyReports: DailyReport[] = []
    if (period === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      for (let m = 0; m < 12; m++) {
        monthlyReports.push({
          date: monthNames[m],
          income: incomeStats[m],
          expense: expenseStats[m],
          balance: incomeStats[m] - expenseStats[m]
        })
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
      expenseCategoryReports,
      incomeCategoryReports,
      dailyReports,
      monthlyReports,
      expenseStats,
      incomeStats,
      // 保持向后兼容
      categoryReports: expenseCategoryReports,
      dailyStats: expenseStats
    }
  }

  /**
   * 添加新分类
   */
  async function addCategory(data: { name: string; icon: string; type: 'expense' | 'income' }) {
    const colors = ['#36a2e8', '#f6b756', '#ef5f9a', '#2bd776', '#9966ff', '#ff6b6b', '#4ecdc4']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    // 如果在 Tauri 环境，保存到数据库
    if (isInitialized.value) {
      try {
        const newId = await db.addCategory({
          name: data.name,
          icon: data.icon,
          type: data.type,
          color: randomColor
        })
        categories.value.push({
          id: newId,
          name: data.name,
          icon: data.icon,
          type: data.type,
          color: randomColor
        })
        return newId
      } catch (error) {
        console.error('Failed to save category to database:', error)
        dbError.value = String(error)
      }
    }
    
    // 回退到内存存储
    const newId = `cat-${Date.now()}`
    categories.value.push({
      id: newId,
      name: data.name,
      icon: data.icon,
      type: data.type,
      color: randomColor
    })
    return newId
  }

  /**
   * 初始化数据库连接并加载数据
   * 在 App.vue 中调用
   */
  async function initialize() {
    if (isInitialized.value || isLoading.value) return
    
    isLoading.value = true
    dbError.value = null
    
    try {
      // 从数据库加载分类
      const dbCategories = await db.getAllCategories()
      if (dbCategories.length > 0) {
        categories.value = dbCategories
      }
      
      // 从数据库加载交易记录
      const dbTransactions = await db.getAllTransactions()
      transactions.value = dbTransactions
      
      isInitialized.value = true
      console.log('Database initialized successfully')
      console.log(`Loaded ${dbCategories.length} categories and ${dbTransactions.length} transactions`)
    } catch (error) {
      console.error('Failed to initialize database:', error)
      dbError.value = String(error)
      // 保持使用模拟数据作为回退
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新数据（从数据库重新加载）
   */
  async function refresh() {
    if (!isInitialized.value) return
    
    try {
      const dbTransactions = await db.getAllTransactions()
      transactions.value = dbTransactions
      
      const dbCategories = await db.getAllCategories()
      if (dbCategories.length > 0) {
        categories.value = dbCategories
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
      dbError.value = String(error)
    }
  }

  return {
    // 状态
    transactions,
    categories,
    isInitialized,
    isLoading,
    dbError,
    
    // 计算属性
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    weeklyActivity,
    recentTransactions,
    statistics,
    
    // 方法
    initialize,
    refresh,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getPeriodStatistics,
    addCategory
  }
})
