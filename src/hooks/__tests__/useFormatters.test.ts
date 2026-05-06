import { describe, expect, it } from 'vitest'
import {
  formatDateISO,
  formatTransactionAmount,
  formatWithCurrency,
  getAmountColor,
} from '../useFormatters'

describe('formatters', () => {
  it('formats currency with currency-specific precision', () => {
    expect(formatWithCurrency(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatWithCurrency(1234.5, 'JPY')).toBe('¥1,235')
    expect(formatWithCurrency(1234.5, 'IDR')).toBe('Rp1,235')
  })

  it('formats local dates as YYYY-MM-DD', () => {
    expect(formatDateISO(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('adds transaction signs while falling back to default currency outside setup', () => {
    expect(formatTransactionAmount({ type: 'income', amount: 12.3 })).toBe('+$12.30')
    expect(formatTransactionAmount(12.3, 'expense')).toBe('\u2212$12.30')
  })

  it('returns semantic CSS variables for amount colors', () => {
    expect(getAmountColor('income')).toBe('var(--color-income)')
    expect(getAmountColor('expense')).toBe('var(--color-expense)')
  })
})
