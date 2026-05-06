import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useCalendar } from '../useCalendar'
import type { Transaction } from '@/types'

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? 'txn-1',
    type: overrides.type ?? 'expense',
    amount: overrides.amount ?? 0,
    currency: overrides.currency ?? 'USD',
    convertedAmount: overrides.convertedAmount ?? overrides.amount ?? 0,
    exchangeRate: overrides.exchangeRate ?? 1,
    category: overrides.category ?? 'Food',
    categoryIcon: overrides.categoryIcon ?? 'restaurant',
    description: overrides.description ?? '',
    date: overrides.date ?? '2024-02-14',
    createdAt: overrides.createdAt ?? '2024-02-14T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2024-02-14T08:00:00.000Z',
  }
}

describe('useCalendar', () => {
  it('builds a fixed six-week month grid with adjacent month padding', () => {
    vi.setSystemTime(new Date('2024-05-15T12:00:00.000Z'))
    const calendar = useCalendar({
      transactions: ref([]),
      initialYear: 2024,
      initialMonth: 1,
    })

    const days = calendar.calendarData.value.days

    expect(days).toHaveLength(42)
    expect(days[0]).toMatchObject({
      date: '2024-01-28',
      day: 28,
      isCurrentMonth: false,
    })
    expect(days[4]).toMatchObject({
      date: '2024-02-01',
      day: 1,
      isCurrentMonth: true,
    })
    expect(days[32]).toMatchObject({
      date: '2024-02-29',
      day: 29,
      isCurrentMonth: true,
    })
    expect(days[41]).toMatchObject({
      date: '2024-03-09',
      day: 9,
      isCurrentMonth: false,
    })
  })

  it('summarizes income and expense using converted amounts', () => {
    const calendar = useCalendar({
      transactions: ref([
        transaction({ id: 'income', type: 'income', amount: 10, convertedAmount: 70 }),
        transaction({ id: 'expense-a', type: 'expense', amount: 5, convertedAmount: 35 }),
        transaction({ id: 'expense-b', type: 'expense', amount: 2, convertedAmount: 14 }),
        transaction({ id: 'other-month', date: '2024-03-01', type: 'expense', amount: 99, convertedAmount: 99 }),
      ]),
      initialYear: 2024,
      initialMonth: 1,
    })

    const day = calendar.calendarData.value.days.find(item => item.date === '2024-02-14')

    expect(day?.income).toBe(70)
    expect(day?.expense).toBe(49)
    expect(day?.transactions).toHaveLength(3)
    expect(calendar.calendarData.value.totalIncome).toBe(70)
    expect(calendar.calendarData.value.totalExpense).toBe(49)
    expect(calendar.calendarData.value.balance).toBe(21)
  })

  it('selects only current-month days and navigates across year boundaries', () => {
    const calendar = useCalendar({
      transactions: ref([]),
      initialYear: 2024,
      initialMonth: 0,
    })

    const previousMonthDay = calendar.calendarData.value.days[0]
    calendar.selectDate(previousMonthDay)
    expect(calendar.selectedDate.value).not.toBe(previousMonthDay.date)

    const currentMonthDay = calendar.calendarData.value.days.find(day => day.date === '2024-01-15')
    expect(currentMonthDay).toBeDefined()
    calendar.selectDate(currentMonthDay!)
    expect(calendar.selectedDate.value).toBe('2024-01-15')

    calendar.goToPreviousMonth()
    expect(calendar.selectedYear.value).toBe(2023)
    expect(calendar.selectedMonth.value).toBe(11)

    calendar.goToNextMonth()
    expect(calendar.selectedYear.value).toBe(2024)
    expect(calendar.selectedMonth.value).toBe(0)
  })
})
