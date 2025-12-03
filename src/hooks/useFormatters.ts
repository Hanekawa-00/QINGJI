/**
 * 格式化工具组合式函数
 * 可跨平台复用（桌面端/移动端）
 */

import { computed } from 'vue'
import { useCurrencyStore } from '@/stores/currency.store'

// 默认币种符号映射
const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
  AUD: 'A$', CAD: 'C$', CHF: 'Fr', HKD: 'HK$', SGD: 'S$',
  KRW: '₩', INR: '₹', RUB: '₽', BRL: 'R$', MXN: 'Mex$',
  TWD: 'NT$', THB: '฿', MYR: 'RM', PHP: '₱', IDR: 'Rp'
}

/**
 * 格式化货币（使用主币种）
 * 这个函数会自动使用用户设置的主币种
 */
export function formatCurrency(amount: number): string {
  try {
    const currencyStore = useCurrencyStore()
    const currency = currencyStore.primaryCurrency || 'USD'
    const symbol = currencySymbols[currency] || '$'
    
    // 对于日元、韩元等无小数位的货币特殊处理
    const noDecimalCurrencies = ['JPY', 'KRW', 'IDR']
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`
  } catch {
    // 如果 store 不可用（如在 setup 外部调用），使用默认格式
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }
}

/**
 * 按指定币种格式化金额（用于交易列表显示原始币种）
 */
export function formatWithCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || '$'
  const noDecimalCurrencies = ['JPY', 'KRW', 'IDR']
  const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

/**
 * 响应式货币格式化 composable
 * 返回一个响应式的格式化函数，当主币种改变时自动更新
 */
export function useCurrencyFormat() {
  const currencyStore = useCurrencyStore()
  
  // 响应式的币种符号
  const currencySymbol = computed(() => {
    return currencySymbols[currencyStore.primaryCurrency] || '$'
  })
  
  // 响应式的小数位数
  const decimals = computed(() => {
    const noDecimalCurrencies = ['JPY', 'KRW', 'IDR']
    return noDecimalCurrencies.includes(currencyStore.primaryCurrency) ? 0 : 2
  })
  
  // 格式化金额（使用主币种，用于统计/报表）
  const format = (amount: number): string => {
    return `${currencySymbol.value}${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals.value,
      maximumFractionDigits: decimals.value
    })}`
  }
  
  // 格式化金额（使用指定币种，用于交易列表）
  const formatOriginal = (amount: number, currency: string): string => {
    return formatWithCurrency(amount, currency)
  }
  
  return {
    currencySymbol,
    decimals,
    format,           // 主币种格式化（报表/统计用）
    formatOriginal,   // 原始币种格式化（交易列表用）
    primaryCurrency: computed(() => currencyStore.primaryCurrency)
  }
}

/**
 * 格式化日期为本地字符串
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', options || {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * 格式化日期为 YYYY-MM-DD 格式（本地时间）
 */
export function formatDateISO(date: Date | string | number): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化交易金额（带正负号）
 * 支持传入交易对象或单独的金额和类型
 */
export function formatTransactionAmount(
  amountOrTransaction: number | { amount: number; type: 'income' | 'expense' },
  type?: 'income' | 'expense'
): string {
  if (typeof amountOrTransaction === 'object') {
    const formatted = formatCurrency(amountOrTransaction.amount)
    return amountOrTransaction.type === 'income' ? `+${formatted}` : `-${formatted}`
  }
  const formatted = formatCurrency(amountOrTransaction)
  return type === 'income' ? `+${formatted}` : `-${formatted}`
}

/**
 * 获取金额颜色
 */
export function getAmountColor(type: 'income' | 'expense'): string {
  return type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
}

/**
 * 组合式函数导出
 */
export function useFormatters() {
  return {
    formatCurrency,
    formatDate,
    formatDateISO,
    formatTransactionAmount,
    getAmountColor
  }
}
