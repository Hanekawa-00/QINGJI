/**
 * 币种状态管理
 * 管理主币种设置和汇率数据
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CurrencyCode, ExchangeRates, Currency } from '@/types'
import { 
  CURRENCIES, 
  getLatestRates, 
  getHistoricalRates,
  getCurrency, 
  convertCurrency,
  formatCurrencyAmount
} from '@/services/currency'
import * as db from '@/services/database'
import type { Transaction } from '@/types'

export const useCurrencyStore = defineStore('currency', () => {
  // 主币种（用户选择的显示币种）
  const primaryCurrency = ref<CurrencyCode>('USD')
  
  // 当前汇率数据
  const exchangeRates = ref<ExchangeRates | null>(null)
  
  // 汇率加载状态
  const isLoadingRates = ref(false)
  
  // 上次更新时间
  const lastUpdated = ref<Date | null>(null)
  
  // 是否已初始化
  const isInitialized = ref(false)

  // 所有可用币种
  const availableCurrencies = computed(() => CURRENCIES)

  // 主币种信息
  const primaryCurrencyInfo = computed((): Currency | undefined => {
    return getCurrency(primaryCurrency.value)
  })

  // 主币种符号
  const currencySymbol = computed(() => {
    return primaryCurrencyInfo.value?.symbol || '$'
  })

  /**
   * 初始化币种设置
   */
  async function initialize() {
    if (isInitialized.value) return
    
    try {
      // 从数据库加载主币种设置
      const savedCurrency = await db.getSetting('primary_currency')
      if (savedCurrency && isValidCurrencyCode(savedCurrency)) {
        primaryCurrency.value = savedCurrency as CurrencyCode
      }
      
      // 加载汇率
      await fetchExchangeRates()
      
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize currency store:', error)
      // 使用默认值
      isInitialized.value = true
    }
  }

  /**
   * 验证币种代码是否有效
   */
  function isValidCurrencyCode(code: string): boolean {
    return CURRENCIES.some(c => c.code === code)
  }

  /**
   * 设置主币种
   */
  async function setPrimaryCurrency(currency: CurrencyCode) {
    primaryCurrency.value = currency
    
    // 保存到数据库
    try {
      await db.setSetting('primary_currency', currency)
    } catch (error) {
      console.error('Failed to save primary currency:', error)
    }
    
    // 重新获取汇率（以新的主币种为基准）
    await fetchExchangeRates()
  }

  /**
   * 获取最新汇率
   */
  async function fetchExchangeRates() {
    isLoadingRates.value = true
    
    try {
      exchangeRates.value = await getLatestRates(primaryCurrency.value)
      lastUpdated.value = new Date()
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
    } finally {
      isLoadingRates.value = false
    }
  }

  /**
   * 转换金额到主币种
   */
  function convertToBaseCurrency(
    amount: number, 
    fromCurrency: CurrencyCode
  ): { convertedAmount: number; rate: number } {
    if (!exchangeRates.value) {
      return { convertedAmount: amount, rate: 1 }
    }
    
    if (fromCurrency === primaryCurrency.value) {
      return { convertedAmount: amount, rate: 1 }
    }
    
    return convertCurrency(amount, fromCurrency, primaryCurrency.value, exchangeRates.value)
  }

  /**
   * 获取两种货币之间的汇率
   */
  function getRate(from: CurrencyCode, to: CurrencyCode): number {
    if (!exchangeRates.value || from === to) {
      return 1
    }
    return convertCurrency(1, from, to, exchangeRates.value).rate
  }

  /**
   * 格式化金额显示（使用主币种）
   */
  function formatAmount(amount: number, currency?: CurrencyCode): string {
    return formatCurrencyAmount(amount, currency || primaryCurrency.value)
  }

  /**
   * 获取币种信息
   */
  function getCurrencyInfo(code: CurrencyCode): Currency | undefined {
    return getCurrency(code)
  }

  // 重新计算进度
  const recalculationProgress = ref(0)
  const isRecalculating = ref(false)

  /**
   * 使用历史汇率重新计算所有交易的 convertedAmount
   * 当用户更换主币种后调用此函数，确保报表数据准确
   */
  async function recalculateAllTransactions(
    transactions: Transaction[],
    onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>
  ): Promise<{ success: number; failed: number; usedFallback: number }> {
    isRecalculating.value = true
    recalculationProgress.value = 0
    
    let success = 0
    let failed = 0
    let usedFallback = 0
    const total = transactions.length
    
    // 按日期分组，减少 API 调用次数
    const dateGroups: Record<string, Transaction[]> = {}
    transactions.forEach(t => {
      const date = t.date
      if (!dateGroups[date]) {
        dateGroups[date] = []
      }
      dateGroups[date].push(t)
    })
    
    // 缓存历史汇率
    const ratesCache: Record<string, ExchangeRates> = {}
    
    let processed = 0
    for (const [date, txns] of Object.entries(dateGroups)) {
      try {
        // 获取该日期的历史汇率（如果不在缓存中）
        if (!ratesCache[date]) {
          ratesCache[date] = await getHistoricalRates(date, primaryCurrency.value)
        }
        const rates = ratesCache[date]
        
        // 更新该日期的所有交易
        for (const txn of txns) {
          try {
            const fromCurrency = (txn.currency || 'USD') as CurrencyCode
            
            if (fromCurrency === primaryCurrency.value) {
              // 币种相同，不需要转换
              await onUpdate(txn.id, {
                convertedAmount: txn.amount,
                exchangeRate: 1
              })
            } else {
              // 使用历史汇率转换
              const { convertedAmount, rate } = convertCurrency(
                txn.amount, 
                fromCurrency, 
                primaryCurrency.value, 
                rates
              )
              await onUpdate(txn.id, {
                convertedAmount,
                exchangeRate: rate
              })
            }
            success++
          } catch (error) {
            console.error(`Failed to recalculate transaction ${txn.id}:`, error)
            failed++
          }
          
          processed++
          recalculationProgress.value = Math.round((processed / total) * 100)
        }
      } catch (error) {
        console.error(`Failed to fetch historical rates for ${date}:`, error)
        // 如果获取历史汇率失败，使用当前汇率（并标记）
        for (const txn of txns) {
          try {
            const result = convertToBaseCurrency(txn.amount, (txn.currency || 'USD') as CurrencyCode)
            await onUpdate(txn.id, {
              convertedAmount: result.convertedAmount,
              exchangeRate: result.rate
            })
            success++
            usedFallback++ // 标记使用了回退汇率
          } catch {
            failed++
          }
          processed++
          recalculationProgress.value = Math.round((processed / total) * 100)
        }
      }
    }
    
    isRecalculating.value = false
    recalculationProgress.value = 100
    
    return { success, failed, usedFallback }
  }

  return {
    // State
    primaryCurrency,
    exchangeRates,
    isLoadingRates,
    lastUpdated,
    isInitialized,
    recalculationProgress,
    isRecalculating,
    
    // Getters
    availableCurrencies,
    primaryCurrencyInfo,
    currencySymbol,
    
    // Actions
    initialize,
    setPrimaryCurrency,
    fetchExchangeRates,
    convertToBaseCurrency,
    getRate,
    formatAmount,
    getCurrencyInfo,
    recalculateAllTransactions,
  }
})
