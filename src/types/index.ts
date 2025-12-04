/**
 * 通用类型定义
 */

/**
 * 交易类型
 */
export type TransactionType = 'income' | 'expense'

/**
 * 支持的币种代码
 * 基于 Frankfurter API (ECB 数据源) 实际支持的币种
 */
export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' 
  | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD'
  | 'KRW' | 'INR' | 'BRL' | 'MXN'
  | 'THB' | 'MYR' | 'PHP' | 'IDR'
  | 'NZD' | 'SEK' | 'NOK' | 'PLN' | 'TRY' | 'ZAR'

/**
 * 币种信息
 */
export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  flag: string // emoji flag
}

/**
 * 汇率数据
 */
export interface ExchangeRates {
  base: CurrencyCode
  date: string
  rates: Record<string, number>
}

/**
 * 交易记录
 */
export interface Transaction {
  id: string
  type: TransactionType
  amount: number              // 原始金额
  currency: CurrencyCode      // 原始币种
  convertedAmount: number     // 转换后的主币种金额
  exchangeRate: number        // 记录时的汇率
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
  weeklyTotal: number
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

/**
 * 报告期间类型
 */
export type ReportPeriod = 'month' | 'year'

/**
 * 分类报告
 */
export interface CategoryReport {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  totalAmount: number
  percentage: number
  change: number // 相比上期的变化金额
  changePercentage: number // 相比上期的变化百分比
  transactionCount: number
}

/**
 * 每日报告
 */
export interface DailyReport {
  date: string
  income: number
  expense: number
  balance: number
}

/**
 * 时间范围统计
 */
export interface PeriodStatistics {
  period: ReportPeriod
  year: number
  month?: number // 仅在 period 为 'month' 时有值
  totalIncome: number
  totalExpense: number
  balance: number
  avgDailyExpense: number
  expenseChange: number // 相比上期的变化百分比
  expenseCategoryReports: CategoryReport[] // 支出分类报告
  incomeCategoryReports: CategoryReport[] // 收入分类报告
  categoryReports: CategoryReport[] // 向后兼容（等同于支出分类）
  dailyReports: DailyReport[]
  monthlyReports: DailyReport[] // 月度报告（年度视图用）
  expenseStats: number[] // 每日/月支出金额数组
  incomeStats: number[] // 每日/月收入金额数组
  dailyStats: number[] // 向后兼容（等同于支出统计）
}

/**
 * 日历日期数据
 */
export interface CalendarDay {
  date: string // YYYY-MM-DD 格式
  day: number // 日期（1-31）
  isCurrentMonth: boolean // 是否属于当前月
  isToday: boolean // 是否是今天
  isSelected: boolean // 是否被选中
  income: number // 当日收入
  expense: number // 当日支出
  transactions: Transaction[] // 当日交易列表
}

/**
 * 月度日历数据
 */
export interface MonthCalendar {
  year: number
  month: number // 0-11
  days: CalendarDay[] // 包含42天（6周）的数据
  totalIncome: number // 本月总收入
  totalExpense: number // 本月总支出
  balance: number // 本月余额
}

/**
 * 主题模式
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 主题名称（预设主题）
 */
export type ThemeName = 'default' | 'ocean' | 'sunset' | 'rose' | 'lavender'

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  primary: string
  primaryHover: string
  primaryPressed: string
  background: string
  backgroundDark: string
  surface: string
  surfaceHover: string
  border: string
  textStrong: string
  textMuted: string
  income: string
  expense: string
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  name: ThemeName
  label: string
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
}
