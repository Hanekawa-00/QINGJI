/**
 * 币种和汇率服务
 * 使用 Frankfurter API (免费、无需 API Key)
 * https://frankfurter.dev/
 */

import type { Currency, CurrencyCode, ExchangeRates } from '@/types'

// Frankfurter API 基础 URL
const API_BASE = 'https://api.frankfurter.dev/v1'

/**
 * 支持的币种列表
 */
export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
]

/**
 * 获取币种信息
 */
export function getCurrency(code: CurrencyCode): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}

/**
 * 格式化货币金额
 */
export function formatCurrencyAmount(amount: number, currencyCode: CurrencyCode): string {
  const currency = getCurrency(currencyCode)
  if (!currency) return `${amount.toFixed(2)}`
  
  // 对于日元、韩元等无小数位的货币特殊处理
  const noDecimalCurrencies: CurrencyCode[] = ['JPY', 'KRW', 'IDR']
  const decimals = noDecimalCurrencies.includes(currencyCode) ? 0 : 2
  
  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

// 汇率缓存
let ratesCache: ExchangeRates | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

/**
 * 获取最新汇率
 * @param base 基础币种，默认 USD
 */
export async function getLatestRates(base: CurrencyCode = 'USD'): Promise<ExchangeRates> {
  const now = Date.now()
  
  // 检查缓存
  if (ratesCache && ratesCache.base === base && (now - cacheTimestamp) < CACHE_DURATION) {
    return ratesCache
  }
  
  try {
    const response = await fetch(`${API_BASE}/latest?base=${base}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 添加基础币种到汇率（对自身的汇率为 1）
    data.rates[base] = 1
    
    ratesCache = {
      base: base,
      date: data.date,
      rates: data.rates
    }
    cacheTimestamp = now
    
    return ratesCache
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    
    // 如果有缓存，返回缓存数据
    if (ratesCache) {
      console.warn('Using cached exchange rates')
      return ratesCache
    }
    
    // 返回默认汇率（仅用于离线/错误情况）
    return getDefaultRates(base)
  }
}

/**
 * 获取历史汇率
 * @param date 日期 YYYY-MM-DD
 * @param base 基础币种
 */
export async function getHistoricalRates(date: string, base: CurrencyCode = 'USD'): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${API_BASE}/${date}?base=${base}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    data.rates[base] = 1
    
    return {
      base: base,
      date: data.date,
      rates: data.rates
    }
  } catch (error) {
    console.error('Failed to fetch historical rates:', error)
    return getDefaultRates(base)
  }
}

/**
 * 转换货币
 * @param amount 原始金额
 * @param from 原始币种
 * @param to 目标币种
 * @param rates 汇率数据
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): { convertedAmount: number; rate: number } {
  if (from === to) {
    return { convertedAmount: amount, rate: 1 }
  }
  
  // 如果基础币种不是 from，需要先转换到基础币种
  let rate: number
  
  if (rates.base === from) {
    // 直接使用目标币种的汇率
    rate = rates.rates[to] || 1
  } else if (rates.base === to) {
    // 反向计算
    rate = 1 / (rates.rates[from] || 1)
  } else {
    // 通过基础币种转换
    const fromRate = rates.rates[from] || 1
    const toRate = rates.rates[to] || 1
    rate = toRate / fromRate
  }
  
  return {
    convertedAmount: amount * rate,
    rate: rate
  }
}

/**
 * 获取两种货币之间的汇率
 */
export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  return convertCurrency(1, from, to, rates).rate
}

/**
 * 默认汇率（离线使用）
 * 基于大致的市场汇率，仅作为后备
 */
function getDefaultRates(base: CurrencyCode): ExchangeRates {
  const usdRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CNY: 7.24,
    AUD: 1.53,
    CAD: 1.36,
    CHF: 0.88,
    HKD: 7.82,
    SGD: 1.34,
    KRW: 1320,
    INR: 83.5,
    RUB: 92,
    BRL: 4.97,
    MXN: 17.2,
    TWD: 31.5,
    THB: 35.5,
    MYR: 4.72,
    PHP: 56.5,
    IDR: 15800,
  }
  
  // 如果 base 不是 USD，需要转换
  if (base !== 'USD') {
    const baseRate = usdRates[base] || 1
    const converted: Record<string, number> = {}
    for (const [code, rate] of Object.entries(usdRates)) {
      converted[code] = rate / baseRate
    }
    return {
      base,
      date: new Date().toISOString().split('T')[0],
      rates: converted
    }
  }
  
  return {
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    rates: usdRates
  }
}

/**
 * 清除汇率缓存
 */
export function clearRatesCache(): void {
  ratesCache = null
  cacheTimestamp = 0
}
