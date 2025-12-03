/**
 * 模拟数据生成
 * 用于开发和演示目的
 */

import type { Transaction, Category } from '@/types'

/**
 * 默认分类列表
 */
export const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Drink', icon: 'local_cafe', type: 'expense', color: '#36a2e8' },
  { id: '2', name: 'Shopping', icon: 'shopping_cart', type: 'expense', color: '#f6b756' },
  { id: '3', name: 'Transport', icon: 'directions_car', type: 'expense', color: '#ef5f9a' },
  { id: '4', name: 'Income', icon: 'receipt_long', type: 'income', color: '#2bd776' }
]

/**
 * 上月支出模板
 */
const lastMonthExpenseTemplates = [
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

/**
 * 本月支出模板
 */
const currentMonthExpenseTemplates = [
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

/**
 * 创建交易记录
 */
function createTransaction(
  id: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  categoryIcon: string,
  description: string,
  date: string,
  time: string
): Transaction {
  const datetime = `${date}T${time}`
  return {
    id,
    type,
    amount,
    currency: 'USD',           // 默认使用 USD
    convertedAmount: amount,   // 转换金额等于原始金额
    exchangeRate: 1,           // 默认汇率为 1
    category,
    categoryIcon,
    description,
    date,
    createdAt: datetime,
    updatedAt: datetime
  }
}

/**
 * 格式化日期
 */
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 生成模拟交易数据
 */
export function generateMockTransactions(): Transaction[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  
  const data: Transaction[] = []
  
  // 计算上月信息
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthDays = new Date(lastMonthYear, lastMonth + 1, 0).getDate()
  
  // 上月收入
  data.push(createTransaction(
    'lm-salary',
    'income',
    5200.00,
    'Income',
    'receipt_long',
    'Monthly Salary',
    formatDate(lastMonthYear, lastMonth, 1),
    '09:00:00'
  ))
  
  // 上月支出
  lastMonthExpenseTemplates.forEach((exp, idx) => {
    if (exp.day <= lastMonthDays) {
      data.push(createTransaction(
        `lm-${idx}`,
        'expense',
        exp.amount,
        exp.cat,
        exp.icon,
        exp.desc,
        formatDate(lastMonthYear, lastMonth, exp.day),
        `${String(10 + idx).padStart(2, '0')}:00:00`
      ))
    }
  })
  
  // 本月收入
  data.push(createTransaction(
    'cm-salary',
    'income',
    5200.00,
    'Income',
    'receipt_long',
    'Monthly Salary',
    formatDate(currentYear, currentMonth, 1),
    '09:00:00'
  ))
  
  // 本月额外收入（15日后）
  if (currentDay >= 15) {
    data.push(createTransaction(
      'cm-bonus',
      'income',
      800.00,
      'Income',
      'receipt_long',
      'Project Bonus',
      formatDate(currentYear, currentMonth, 15),
      '14:00:00'
    ))
  }
  
  // 本月支出（根据当前日期动态生成）
  currentMonthExpenseTemplates.forEach((exp, idx) => {
    if (exp.day <= currentDay) {
      data.push(createTransaction(
        `cm-${idx}`,
        'expense',
        exp.amount,
        exp.cat,
        exp.icon,
        exp.desc,
        formatDate(currentYear, currentMonth, exp.day),
        `${String(8 + (idx % 12)).padStart(2, '0')}:${String((idx * 7) % 60).padStart(2, '0')}:00`
      ))
    }
  })
  
  return data
}
