/**
 * 通用类型定义
 */

/**
 * 交易类型
 */
export type TransactionType = 'income' | 'expense'

/**
 * 交易记录
 */
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  categoryIcon: string
  description: string
  date: string
  createdAt: string
  updatedAt: string
}

/**
 * 分类
 */
export interface Category {
  id: string
  name: string
  icon: string
  type: TransactionType
  color: string
}

/**
 * 统计数据
 */
export interface Statistics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  weeklyActivity: number[]
  dailyAverage: number
}

/**
 * 用户信息
 */
export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
}
