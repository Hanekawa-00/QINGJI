/**
 * 数据库服务层
 * 封装 SQLite 数据库操作
 */

import Database from '@tauri-apps/plugin-sql'
import type { Transaction, Category, CurrencyCode } from '@/types'

// 数据库单例
let db: Database | null = null

/**
 * 获取数据库连接（单例模式）
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:account.db')
  }
  return db
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
    db = null
  }
}

// ==================== 分类操作 ====================

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<Category[]> {
  const database = await getDatabase()
  const results = await database.select<Array<{
    id: string
    name: string
    icon: string
    type: string
    color: string | null
    sort_order: number
  }>>('SELECT * FROM categories ORDER BY sort_order ASC')
  
  return results.map(row => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type as 'income' | 'expense',
    color: row.color || '#2bd776'
  }))
}

/**
 * 按类型获取分类
 */
export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
  const database = await getDatabase()
  const results = await database.select<Array<{
    id: string
    name: string
    icon: string
    type: string
    color: string | null
    sort_order: number
  }>>('SELECT * FROM categories WHERE type = $1 ORDER BY sort_order ASC', [type])
  
  return results.map(row => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type as 'income' | 'expense',
    color: row.color || '#2bd776'
  }))
}

/**
 * 添加分类
 */
export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const database = await getDatabase()
  const id = `cat-${Date.now()}`
  
  await database.execute(
    `INSERT INTO categories (id, name, icon, type, color) VALUES ($1, $2, $3, $4, $5)`,
    [id, category.name, category.icon, category.type, category.color || null]
  )
  
  return id
}

/**
 * 删除分类
 */
export async function deleteCategory(id: string): Promise<void> {
  const database = await getDatabase()
  await database.execute('DELETE FROM categories WHERE id = $1', [id])
}

// ==================== 交易操作 ====================

/**
 * 获取所有交易
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const database = await getDatabase()
  const results = await database.select<Array<{
    id: string
    type: string
    amount: number
    currency: string | null
    converted_amount: number | null
    exchange_rate: number | null
    category: string
    category_icon: string | null
    description: string | null
    date: string
    created_at: string
    updated_at: string
  }>>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC')
  
  return results.map(row => ({
    id: row.id,
    type: row.type as 'income' | 'expense',
    amount: row.amount,
    currency: (row.currency || 'USD') as CurrencyCode,
    convertedAmount: row.converted_amount ?? row.amount,
    exchangeRate: row.exchange_rate ?? 1,
    category: row.category,
    categoryIcon: row.category_icon || 'receipt_long',
    description: row.description || '',
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

/**
 * 按日期范围获取交易
 */
export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const database = await getDatabase()
  const results = await database.select<Array<{
    id: string
    type: string
    amount: number
    currency: string | null
    converted_amount: number | null
    exchange_rate: number | null
    category: string
    category_icon: string | null
    description: string | null
    date: string
    created_at: string
    updated_at: string
  }>>(
    'SELECT * FROM transactions WHERE date >= $1 AND date <= $2 ORDER BY date DESC, created_at DESC',
    [startDate, endDate]
  )
  
  return results.map(row => ({
    id: row.id,
    type: row.type as 'income' | 'expense',
    amount: row.amount,
    currency: (row.currency || 'USD') as CurrencyCode,
    convertedAmount: row.converted_amount ?? row.amount,
    exchangeRate: row.exchange_rate ?? 1,
    category: row.category,
    categoryIcon: row.category_icon || 'receipt_long',
    description: row.description || '',
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

/**
 * 按日期获取交易
 */
export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const database = await getDatabase()
  const results = await database.select<Array<{
    id: string
    type: string
    amount: number
    currency: string | null
    converted_amount: number | null
    exchange_rate: number | null
    category: string
    category_icon: string | null
    description: string | null
    date: string
    created_at: string
    updated_at: string
  }>>(
    'SELECT * FROM transactions WHERE date = $1 ORDER BY created_at DESC',
    [date]
  )
  
  return results.map(row => ({
    id: row.id,
    type: row.type as 'income' | 'expense',
    amount: row.amount,
    currency: (row.currency || 'USD') as CurrencyCode,
    convertedAmount: row.converted_amount ?? row.amount,
    exchangeRate: row.exchange_rate ?? 1,
    category: row.category,
    categoryIcon: row.category_icon || 'receipt_long',
    description: row.description || '',
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

/**
 * 添加交易
 */
export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = await getDatabase()
  const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  await database.execute(
    `INSERT INTO transactions (id, type, amount, currency, converted_amount, exchange_rate, category, category_icon, description, date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      transaction.type,
      transaction.amount,
      transaction.currency || 'USD',
      transaction.convertedAmount ?? transaction.amount,
      transaction.exchangeRate ?? 1,
      transaction.category,
      transaction.categoryIcon || null,
      transaction.description || null,
      transaction.date,
      now,
      now
    ]
  )
  
  return id
}

/**
 * 更新交易
 */
export async function updateTransaction(
  id: string,
  transaction: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const database = await getDatabase()
  const now = new Date().toISOString()
  
  const fields: string[] = ['updated_at = $1']
  const values: any[] = [now]
  let paramIndex = 2
  
  if (transaction.type !== undefined) {
    fields.push(`type = $${paramIndex++}`)
    values.push(transaction.type)
  }
  if (transaction.amount !== undefined) {
    fields.push(`amount = $${paramIndex++}`)
    values.push(transaction.amount)
  }
  if (transaction.currency !== undefined) {
    fields.push(`currency = $${paramIndex++}`)
    values.push(transaction.currency)
  }
  if (transaction.convertedAmount !== undefined) {
    fields.push(`converted_amount = $${paramIndex++}`)
    values.push(transaction.convertedAmount)
  }
  if (transaction.exchangeRate !== undefined) {
    fields.push(`exchange_rate = $${paramIndex++}`)
    values.push(transaction.exchangeRate)
  }
  if (transaction.category !== undefined) {
    fields.push(`category = $${paramIndex++}`)
    values.push(transaction.category)
  }
  if (transaction.categoryIcon !== undefined) {
    fields.push(`category_icon = $${paramIndex++}`)
    values.push(transaction.categoryIcon)
  }
  if (transaction.description !== undefined) {
    fields.push(`description = $${paramIndex++}`)
    values.push(transaction.description)
  }
  if (transaction.date !== undefined) {
    fields.push(`date = $${paramIndex++}`)
    values.push(transaction.date)
  }
  
  values.push(id)
  
  await database.execute(
    `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  )
}

/**
 * 删除交易
 */
export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDatabase()
  await database.execute('DELETE FROM transactions WHERE id = $1', [id])
}

// ==================== 统计查询 ====================

/**
 * 获取月度统计（使用转换后的金额，即主币种）
 */
export async function getMonthlyStats(year: number, month: number): Promise<{
  income: number
  expense: number
  balance: number
}> {
  const database = await getDatabase()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`
  
  const incomeResult = await database.select<[{ total: number | null }]>(
    `SELECT COALESCE(SUM(COALESCE(converted_amount, amount)), 0) as total FROM transactions
     WHERE type = 'income' AND date >= $1 AND date <= $2`,
    [startDate, endDate]
  )
  
  const expenseResult = await database.select<[{ total: number | null }]>(
    `SELECT COALESCE(SUM(COALESCE(converted_amount, amount)), 0) as total FROM transactions
     WHERE type = 'expense' AND date >= $1 AND date <= $2`,
    [startDate, endDate]
  )
  
  const income = incomeResult[0]?.total || 0
  const expense = expenseResult[0]?.total || 0
  
  return {
    income,
    expense,
    balance: income - expense
  }
}

/**
 * 获取分类统计（使用转换后的金额）
 */
export async function getCategoryStats(
  type: 'income' | 'expense',
  startDate: string,
  endDate: string
): Promise<Array<{ category: string; total: number; count: number }>> {
  const database = await getDatabase()
  
  return await database.select<Array<{ category: string; total: number; count: number }>>(
    `SELECT category, SUM(COALESCE(converted_amount, amount)) as total, COUNT(*) as count
     FROM transactions
     WHERE type = $1 AND date >= $2 AND date <= $3
     GROUP BY category
     ORDER BY total DESC`,
    [type, startDate, endDate]
  )
}

/**
 * 获取每日统计（使用转换后的金额）
 */
export async function getDailyStats(
  type: 'income' | 'expense',
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; total: number }>> {
  const database = await getDatabase()
  
  return await database.select<Array<{ date: string; total: number }>>(
    `SELECT date, SUM(COALESCE(converted_amount, amount)) as total
     FROM transactions
     WHERE type = $1 AND date >= $2 AND date <= $3
     GROUP BY date
     ORDER BY date ASC`,
    [type, startDate, endDate]
  )
}

/**
 * 获取总余额（使用转换后的金额）
 */
export async function getTotalBalance(): Promise<number> {
  const database = await getDatabase()
  
  const incomeResult = await database.select<[{ total: number | null }]>(
    `SELECT COALESCE(SUM(COALESCE(converted_amount, amount)), 0) as total FROM transactions WHERE type = 'income'`
  )
  
  const expenseResult = await database.select<[{ total: number | null }]>(
    `SELECT COALESCE(SUM(COALESCE(converted_amount, amount)), 0) as total FROM transactions WHERE type = 'expense'`
  )
  
  const income = incomeResult[0]?.total || 0
  const expense = expenseResult[0]?.total || 0
  
  return income - expense
}

// ==================== 设置操作 ====================

/**
 * 获取设置
 */
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase()
  const results = await database.select<Array<{ value: string }>>(
    'SELECT value FROM settings WHERE key = $1',
    [key]
  )
  return results[0]?.value || null
}

/**
 * 设置值
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase()
  await database.execute(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  )
}

/**
 * 获取所有设置
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDatabase()
  const results = await database.select<Array<{ key: string; value: string }>>(
    'SELECT key, value FROM settings'
  )
  
  const settings: Record<string, string> = {}
  for (const row of results) {
    settings[row.key] = row.value
  }
  return settings
}

