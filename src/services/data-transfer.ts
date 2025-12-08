/**
 * 数据导入导出服务
 * 跨平台兼容，支持桌面端和移动端
 */

import type { Transaction, Category, CurrencyCode } from '@/types'

// 延迟导入 Tauri APIs（避免在非 Tauri 环境报错）
let tauriSave: typeof import('@tauri-apps/plugin-dialog').save | null = null
let tauriWriteTextFile: typeof import('@tauri-apps/plugin-fs').writeTextFile | null = null
let tauriPlatform: typeof import('@tauri-apps/plugin-os').platform | null = null
let tauriInitialized = false
let currentPlatform: string | null = null

// 初始化 Tauri APIs
async function initTauriApis(): Promise<boolean> {
  if (tauriInitialized) {
    return tauriSave !== null
  }
  
  tauriInitialized = true
  
  try {
    // 检测 Tauri 环境
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      console.log('Not in Tauri environment')
      return false
    }
    
    const dialogModule = await import('@tauri-apps/plugin-dialog')
    const fsModule = await import('@tauri-apps/plugin-fs')
    const osModule = await import('@tauri-apps/plugin-os')
    
    tauriSave = dialogModule.save
    tauriWriteTextFile = fsModule.writeTextFile
    tauriPlatform = osModule.platform
    
    // 获取当前平台
    currentPlatform = await tauriPlatform()
    
    console.log('Tauri APIs initialized, platform:', currentPlatform)
    return true
  } catch (error) {
    console.warn('Failed to initialize Tauri APIs:', error)
    return false
  }
}

// 检查是否为移动端
function isMobilePlatform(): boolean {
  return currentPlatform === 'android' || currentPlatform === 'ios'
}

// 移动端导出：保存到应用目录并提示用户
async function exportForMobile(
  content: string, 
  fileName: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (!tauriWriteTextFile) {
      throw new Error('writeTextFile not available')
    }
    
    // 在移动端，我们使用 BaseDirectory.Document 保存文件
    const fsModule = await import('@tauri-apps/plugin-fs')
    const { BaseDirectory } = fsModule
    
    // 直接保存到 Documents 目录
    await tauriWriteTextFile(fileName, content, { 
      baseDir: BaseDirectory.Document 
    })
    
    return { success: true, path: `Documents/${fileName}` }
  } catch (error) {
    console.error('Mobile export failed:', error)
    // 回退到浏览器方式
    downloadFileBrowser(content, fileName)
    return { success: true, error: 'Saved via browser download' }
  }
}

// ==================== 类型定义 ====================

/**
 * 导出数据格式
 */
export interface ExportData {
  version: string
  exportedAt: string
  appName: string
  settings: {
    primaryCurrency: CurrencyCode
  }
  categories: Category[]
  transactions: Transaction[]
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean
  categoriesImported: number
  transactionsImported: number
  categoriesSkipped: number
  transactionsSkipped: number
  error?: string
}

/**
 * 合并策略
 */
export type MergeStrategy = 
  | 'skip'      // 跳过重复项（默认）
  | 'replace'   // 替换重复项
  | 'smart'     // 智能合并（按内容判断是否重复）

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 合并策略 */
  mergeStrategy?: MergeStrategy
  /** 是否导入设置 */
  importSettings?: boolean
}

// ==================== 常量 ====================

const CURRENT_VERSION = '1.0.0'
const APP_NAME = 'Qingzhang'

// ==================== 导出功能 ====================

/**
 * 生成导出数据对象
 */
export function generateExportData(
  transactions: Transaction[],
  categories: Category[],
  primaryCurrency: CurrencyCode
): ExportData {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: APP_NAME,
    settings: {
      primaryCurrency
    },
    categories: categories.map(c => ({ ...c })),
    transactions: transactions.map(t => ({ ...t }))
  }
}

/**
 * 将数据转换为 JSON 字符串
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * 生成导出文件名
 */
export function generateExportFileName(format: 'json' | 'csv' = 'json'): string {
  const date = new Date().toISOString().split('T')[0]
  return `qingzhang-backup-${date}.${format}`
}

/**
 * 触发文件下载（浏览器环境回退方案）
 */
function downloadFileBrowser(content: string, fileName: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 使用 Tauri 保存对话框导出文件
 */
async function saveFileWithDialog(
  content: string, 
  defaultFileName: string,
  filters: { name: string; extensions: string[] }[]
): Promise<{ success: boolean; path?: string; error?: string }> {
  // 初始化并检查 Tauri 环境
  const hasTauri = await initTauriApis()
  
  if (!hasTauri || !tauriWriteTextFile) {
    console.log('Using browser download')
    downloadFileBrowser(content, defaultFileName)
    return { success: true }
  }
  
  // 移动端使用直接保存
  if (isMobilePlatform()) {
    console.log('Using mobile export')
    return exportForMobile(content, defaultFileName)
  }

  // 桌面端使用对话框
  if (!tauriSave) {
    downloadFileBrowser(content, defaultFileName)
    return { success: true }
  }

  try {
    console.log('Using Tauri save dialog')
    
    // 打开保存对话框
    const filePath = await tauriSave({
      defaultPath: defaultFileName,
      filters
    })
    
    if (!filePath) {
      return { success: false, error: 'User cancelled' }
    }
    
    // 写入文件
    await tauriWriteTextFile(filePath, content)
    
    return { success: true, path: filePath }
  } catch (error) {
    console.error('Save file failed:', error)
    // 回退到浏览器下载
    downloadFileBrowser(content, defaultFileName)
    return { success: true, error: 'Fallback to browser download' }
  }
}

/**
 * 导出数据为 JSON（支持选择保存路径）
 */
export async function exportAndDownload(
  transactions: Transaction[],
  categories: Category[],
  primaryCurrency: CurrencyCode
): Promise<{ success: boolean; path?: string; error?: string }> {
  const data = generateExportData(transactions, categories, primaryCurrency)
  const json = exportToJSON(data)
  const fileName = generateExportFileName('json')
  
  return saveFileWithDialog(json, fileName, [
    { name: 'JSON Files', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
  ])
}

/**
 * 导出交易为 CSV（支持选择保存路径）
 */
export async function exportCSVAndDownload(
  transactions: Transaction[]
): Promise<{ success: boolean; path?: string; error?: string }> {
  const csv = exportToCSV(transactions)
  const fileName = generateExportFileName('csv')
  
  return saveFileWithDialog(csv, fileName, [
    { name: 'CSV Files', extensions: ['csv'] },
    { name: 'All Files', extensions: ['*'] }
  ])
}

// ==================== 导入功能 ====================

/**
 * 验证导入数据格式
 */
export function validateImportData(data: unknown): { valid: boolean; error?: string; data?: ExportData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format: not an object' }
  }

  const obj = data as Record<string, unknown>

  // 检查必要字段
  if (!obj.version || typeof obj.version !== 'string') {
    return { valid: false, error: 'Missing or invalid version field' }
  }

  if (!obj.categories || !Array.isArray(obj.categories)) {
    return { valid: false, error: 'Missing or invalid categories field' }
  }

  if (!obj.transactions || !Array.isArray(obj.transactions)) {
    return { valid: false, error: 'Missing or invalid transactions field' }
  }

  // 版本兼容性检查
  const [major] = obj.version.split('.').map(Number)
  const [currentMajor] = CURRENT_VERSION.split('.').map(Number)
  
  if (major > currentMajor) {
    return { valid: false, error: `Unsupported version: ${obj.version}. Please update the app.` }
  }

  return { valid: true, data: obj as unknown as ExportData }
}

/**
 * 解析导入文件
 */
export async function parseImportFile(file: File): Promise<{ success: boolean; data?: ExportData; error?: string }> {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const validation = validateImportData(parsed)
    
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }
    
    return { success: true, data: validation.data }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON format' }
    }
    return { success: false, error: String(error) }
  }
}

/**
 * 执行数据导入
 * @param data 导入数据
 * @param existingCategories 现有分类
 * @param existingTransactions 现有交易
 * @param addCategory 添加分类的回调
 * @param addTransaction 添加交易的回调
 * @param options 导入选项
 */
export async function performImport(
  data: ExportData,
  existingCategories: Category[],
  existingTransactions: Transaction[],
  addCategory: (category: { name: string; icon: string; type: 'income' | 'expense' }) => Promise<unknown>,
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<unknown>,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { mergeStrategy = 'smart' } = options
  
  let categoriesImported = 0
  let categoriesSkipped = 0
  let transactionsImported = 0
  let transactionsSkipped = 0

  try {
    // 导入分类（按名称+类型判断重复）
    for (const category of data.categories) {
      const exists = existingCategories.find(
        c => c.name === category.name && c.type === category.type
      )
      
      if (!exists) {
        await addCategory({
          name: category.name,
          icon: category.icon,
          type: category.type
        })
        categoriesImported++
      } else {
        categoriesSkipped++
      }
    }

    // 导入交易
    for (const txn of data.transactions) {
      let shouldImport = false
      
      if (mergeStrategy === 'skip') {
        // 按 ID 判断重复
        const existsById = existingTransactions.find(t => t.id === txn.id)
        shouldImport = !existsById
      } else if (mergeStrategy === 'replace') {
        // 总是导入（允许重复）
        shouldImport = true
      } else {
        // smart: 按内容判断重复（日期+金额+分类+描述）
        const existsByContent = existingTransactions.find(t => 
          t.date === txn.date &&
          t.amount === txn.amount &&
          t.category === txn.category &&
          t.type === txn.type &&
          (t.description || '') === (txn.description || '')
        )
        shouldImport = !existsByContent
      }
      
      if (shouldImport) {
        await addTransaction({
          type: txn.type,
          amount: txn.amount,
          currency: txn.currency || 'USD',
          convertedAmount: txn.convertedAmount || txn.amount,
          exchangeRate: txn.exchangeRate || 1,
          category: txn.category,
          categoryIcon: txn.categoryIcon,
          description: txn.description,
          date: txn.date
        })
        transactionsImported++
      } else {
        transactionsSkipped++
      }
    }

    return {
      success: true,
      categoriesImported,
      categoriesSkipped,
      transactionsImported,
      transactionsSkipped
    }
  } catch (error) {
    return {
      success: false,
      categoriesImported,
      categoriesSkipped,
      transactionsImported,
      transactionsSkipped,
      error: String(error)
    }
  }
}

// ==================== CSV 支持 ====================

// CSV 列名映射
const CSV_HEADERS = ['Date', 'Type', 'Amount', 'Currency', 'Converted Amount', 'Exchange Rate', 'Category', 'Description']

/**
 * 导出交易为 CSV 格式
 */
export function exportToCSV(transactions: Transaction[]): string {
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.amount.toString(),
    t.currency,
    t.convertedAmount?.toString() || t.amount.toString(),
    t.exchangeRate?.toString() || '1',
    t.category,
    `"${(t.description || '').replace(/"/g, '""')}"`
  ])
  
  return [CSV_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * 解析 CSV 行（处理引号内的逗号）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * CSV 导入结果
 */
export interface CSVImportResult {
  success: boolean
  transactions: Array<{
    date: string
    type: 'income' | 'expense'
    amount: number
    currency: string
    convertedAmount: number
    exchangeRate: number
    category: string
    description: string
  }>
  errors: string[]
  skipped: number
}

/**
 * 解析 CSV 文件内容
 */
export function parseCSV(content: string): CSVImportResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  const transactions: CSVImportResult['transactions'] = []
  const errors: string[] = []
  let skipped = 0
  
  if (lines.length === 0) {
    return { success: false, transactions: [], errors: ['Empty file'], skipped: 0 }
  }
  
  // 解析表头
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
  
  // 检查必要列
  const dateIdx = headers.findIndex(h => h.includes('date'))
  const typeIdx = headers.findIndex(h => h.includes('type'))
  const amountIdx = headers.findIndex(h => h.includes('amount') && !h.includes('converted'))
  const categoryIdx = headers.findIndex(h => h.includes('category'))
  
  if (dateIdx === -1 || amountIdx === -1) {
    return { 
      success: false, 
      transactions: [], 
      errors: ['Missing required columns: Date and Amount are required'],
      skipped: 0 
    }
  }
  
  // 可选列
  const currencyIdx = headers.findIndex(h => h === 'currency')
  const convertedIdx = headers.findIndex(h => h.includes('converted'))
  const rateIdx = headers.findIndex(h => h.includes('rate'))
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc') || h.includes('note'))
  
  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])
      
      if (values.length < 2 || !values[dateIdx] || !values[amountIdx]) {
        skipped++
        continue
      }
      
      const amount = parseFloat(values[amountIdx])
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Line ${i + 1}: Invalid amount "${values[amountIdx]}"`)
        continue
      }
      
      // 解析类型
      let type: 'income' | 'expense' = 'expense'
      if (typeIdx !== -1) {
        const typeValue = values[typeIdx]?.toLowerCase()
        if (typeValue === 'income' || typeValue === '收入') {
          type = 'income'
        }
      }
      
      // 解析日期（支持多种格式）
      let date = values[dateIdx]
      // 尝试标准化日期格式为 YYYY-MM-DD
      const dateMatch = date.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (dateMatch) {
        date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
      } else {
        // 尝试 MM/DD/YYYY 格式
        const usDateMatch = date.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
        if (usDateMatch) {
          date = `${usDateMatch[3]}-${usDateMatch[1].padStart(2, '0')}-${usDateMatch[2].padStart(2, '0')}`
        }
      }
      
      const currency = currencyIdx !== -1 ? (values[currencyIdx] || 'USD') : 'USD'
      const convertedAmount = convertedIdx !== -1 ? parseFloat(values[convertedIdx]) || amount : amount
      const exchangeRate = rateIdx !== -1 ? parseFloat(values[rateIdx]) || 1 : 1
      const category = categoryIdx !== -1 ? (values[categoryIdx] || 'Other') : 'Other'
      const description = descIdx !== -1 ? (values[descIdx] || '') : ''
      
      transactions.push({
        date,
        type,
        amount,
        currency,
        convertedAmount,
        exchangeRate,
        category,
        description
      })
    } catch (error) {
      errors.push(`Line ${i + 1}: ${String(error)}`)
    }
  }
  
  return {
    success: transactions.length > 0,
    transactions,
    errors,
    skipped
  }
}

/**
 * 解析 CSV 导入文件
 */
export async function parseCSVImportFile(file: File): Promise<CSVImportResult> {
  try {
    const content = await file.text()
    return parseCSV(content)
  } catch (error) {
    return {
      success: false,
      transactions: [],
      errors: [String(error)],
      skipped: 0
    }
  }
}

// ==================== 统计信息 ====================

/**
 * 获取导入数据的统计信息
 */
export function getImportStats(data: ExportData): {
  categoriesCount: number
  transactionsCount: number
  dateRange: { start: string; end: string } | null
  primaryCurrency: CurrencyCode
} {
  const dates = data.transactions.map(t => t.date).sort()
  
  return {
    categoriesCount: data.categories.length,
    transactionsCount: data.transactions.length,
    dateRange: dates.length > 0 
      ? { start: dates[0], end: dates[dates.length - 1] }
      : null,
    primaryCurrency: data.settings?.primaryCurrency || 'USD'
  }
}
