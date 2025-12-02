/**
 * 用户数据状态管理
 * 业务逻辑 100% 跨平台共享
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, Category, Statistics } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 交易记录
  const transactions = ref<Transaction[]>([
    // 模拟数据
    {
      id: '1',
      type: 'expense',
      amount: 5.75,
      category: 'Food & Drink',
      categoryIcon: 'local_cafe',
      description: 'Starbucks Coffee',
      date: '2024-05-20',
      createdAt: '2024-05-20T10:30:00',
      updatedAt: '2024-05-20T10:30:00'
    },
    {
      id: '2',
      type: 'income',
      amount: 2900.00,
      category: 'Income',
      categoryIcon: 'receipt_long',
      description: 'Monthly Salary',
      date: '2024-05-15',
      createdAt: '2024-05-15T09:00:00',
      updatedAt: '2024-05-15T09:00:00'
    },
    {
      id: '3',
      type: 'expense',
      amount: 89.99,
      category: 'Shopping',
      categoryIcon: 'shopping_cart',
      description: 'Amazon Purchase',
      date: '2024-05-18',
      createdAt: '2024-05-18T14:20:00',
      updatedAt: '2024-05-18T14:20:00'
    }
  ])

  // 分类列表
  const categories = ref<Category[]>([
    { id: '1', name: 'Food & Drink', icon: 'local_cafe', type: 'expense', color: '#ef4444' },
    { id: '2', name: 'Shopping', icon: 'shopping_cart', type: 'expense', color: '#f59e0b' },
    { id: '3', name: 'Transport', icon: 'directions_car', type: 'expense', color: '#3b82f6' },
    { id: '4', name: 'Income', icon: 'receipt_long', type: 'income', color: '#10b981' }
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
    updateTransaction
  }
})
