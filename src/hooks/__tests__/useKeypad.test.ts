import { describe, expect, it } from 'vitest'
import { useKeypad } from '../useKeypad'

function press(keys: string[], handleKeypad: (key: string) => void) {
  keys.forEach(handleKeypad)
}

describe('useKeypad', () => {
  it('builds decimal amounts and supports backspace', () => {
    const keypad = useKeypad({ currency: 'USD', locale: 'en-US' })

    press(['1', '2', '.', '3', '.', '4'], keypad.handleKeypad)
    expect(keypad.displayValue.value).toBe('12.34')
    expect(keypad.numericValue.value).toBe(12.34)
    expect(keypad.formattedAmount.value).toBe('$12.34')

    keypad.handleKeypad('backspace')
    expect(keypad.displayValue.value).toBe('12.3')
  })

  it('handles addition and clears pending state after equals', () => {
    const keypad = useKeypad()

    press(['1', '2', '+', '3', '='], keypad.handleKeypad)

    expect(keypad.displayValue.value).toBe('15')
    expect(keypad.numericValue.value).toBe(15)
    expect(keypad.pendingOperator.value).toBeNull()
    expect(keypad.hasPendingCalculation.value).toBe(false)
  })

  it('never lets subtraction results go below zero', () => {
    const keypad = useKeypad()

    press(['1', '0', '-', '2', '0', 'enter'], keypad.handleKeypad)

    expect(keypad.displayValue.value).toBe('0')
    expect(keypad.numericValue.value).toBe(0)
  })

  it('resets values through clear and setValue', () => {
    const keypad = useKeypad()

    press(['8', '+', '2'], keypad.handleKeypad)
    expect(keypad.hasPendingCalculation.value).toBe(true)

    keypad.clear()
    expect(keypad.displayValue.value).toBe('0')
    expect(keypad.storedValue.value).toBe(0)
    expect(keypad.pendingOperator.value).toBeNull()

    keypad.setValue(42.5)
    expect(keypad.displayValue.value).toBe('42.5')
    expect(keypad.numericValue.value).toBe(42.5)
  })
})
