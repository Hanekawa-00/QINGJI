/**
 * 格式化工具组合式函数
 * 可跨平台复用（桌面端/移动端）
 */

/**
 * 格式化货币
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
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
