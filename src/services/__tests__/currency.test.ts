import { describe, expect, it } from 'vitest'
import {
  convertCurrency,
  formatCurrencyAmount,
  getCurrency,
  getExchangeRate,
} from '../currency'
import type { ExchangeRates } from '@/types'

const usdRates: ExchangeRates = {
  base: 'USD',
  date: '2024-01-01',
  rates: {
    USD: 1,
    EUR: 0.8,
    JPY: 160,
  },
}

describe('currency service', () => {
  it('looks up supported currency metadata', () => {
    expect(getCurrency('USD')).toMatchObject({
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
    })
  })

  it('formats currencies with expected decimals', () => {
    expect(formatCurrencyAmount(12.3, 'USD')).toBe('$12.30')
    expect(formatCurrencyAmount(12.3, 'JPY')).toBe('¥12')
  })

  it('converts from the rate base directly', () => {
    expect(convertCurrency(10, 'USD', 'EUR', usdRates)).toEqual({
      convertedAmount: 8,
      rate: 0.8,
    })
  })

  it('converts back to the rate base', () => {
    expect(convertCurrency(8, 'EUR', 'USD', usdRates)).toEqual({
      convertedAmount: 10,
      rate: 1.25,
    })
  })

  it('converts between non-base currencies through the base', () => {
    expect(convertCurrency(8, 'EUR', 'JPY', usdRates)).toEqual({
      convertedAmount: 1600,
      rate: 200,
    })
    expect(getExchangeRate('JPY', 'EUR', usdRates)).toBe(0.005)
  })
})
