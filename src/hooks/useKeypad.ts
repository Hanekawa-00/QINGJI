/**
 * 数字键盘/计算器 Composable
 * 可跨平台复用（桌面端/移动端）
 */

import { ref, computed } from 'vue'

export interface UseKeypadOptions {
  initialValue?: string
  currency?: string
  locale?: string
}

export function useKeypad(options: UseKeypadOptions = {}) {
  const { 
    initialValue = '0',
    currency = 'USD',
    locale = 'en-US'
  } = options
  
  // 当前显示值
  const displayValue = ref(initialValue)
  
  // 待处理的运算符
  const pendingOperator = ref<'+' | '-' | null>(null)
  
  // 存储的值（用于计算）
  const storedValue = ref<number>(0)
  
  // 数值
  const numericValue = computed(() => parseFloat(displayValue.value) || 0)
  
  // 格式化金额显示
  const formattedAmount = computed(() => {
    const amount = numericValue.value
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount)
    
    // 显示待计算状态
    if (pendingOperator.value) {
      const storedFormatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(storedValue.value)
      return `${storedFormatted} ${pendingOperator.value} ${formatted}`
    }
    return formatted
  })
  
  // 是否有待处理的计算
  const hasPendingCalculation = computed(() => pendingOperator.value !== null)
  
  // 处理键盘输入
  const handleKeypad = (key: string) => {
    if (key === 'backspace' || key === '⌫') {
      // 删除
      if (displayValue.value.length > 1) {
        displayValue.value = displayValue.value.slice(0, -1)
      } else {
        displayValue.value = '0'
      }
    } else if (key === '.') {
      // 小数点
      if (!displayValue.value.includes('.')) {
        displayValue.value += '.'
      }
    } else if (key === '+' || key === '-') {
      // 加减运算
      if (pendingOperator.value && storedValue.value !== 0) {
        // 先计算之前的运算
        const current = numericValue.value
        if (pendingOperator.value === '+') {
          displayValue.value = String(storedValue.value + current)
        } else {
          displayValue.value = String(storedValue.value - current)
        }
      }
      storedValue.value = numericValue.value
      pendingOperator.value = key as '+' | '-'
      displayValue.value = '0'
    } else if (key === '=' || key === 'enter') {
      // 执行计算
      if (pendingOperator.value && storedValue.value !== 0) {
        const current = numericValue.value
        if (pendingOperator.value === '+') {
          displayValue.value = String(storedValue.value + current)
        } else {
          displayValue.value = String(Math.max(0, storedValue.value - current))
        }
        pendingOperator.value = null
        storedValue.value = 0
      }
    } else if (key === 'clear' || key === 'C') {
      // 清除
      displayValue.value = '0'
      pendingOperator.value = null
      storedValue.value = 0
    } else if (/^[0-9]$/.test(key)) {
      // 数字输入
      if (displayValue.value === '0') {
        displayValue.value = key
      } else {
        displayValue.value += key
      }
    }
  }
  
  // 清除所有
  const clear = () => {
    displayValue.value = '0'
    pendingOperator.value = null
    storedValue.value = 0
  }
  
  // 设置值
  const setValue = (value: number | string) => {
    displayValue.value = String(value)
    pendingOperator.value = null
    storedValue.value = 0
  }
  
  return {
    // 状态
    displayValue,
    pendingOperator,
    storedValue,
    
    // 计算属性
    numericValue,
    formattedAmount,
    hasPendingCalculation,
    
    // 方法
    handleKeypad,
    clear,
    setValue
  }
}
