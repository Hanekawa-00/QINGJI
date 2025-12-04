<script setup lang="ts">
/**
 * 可复用计算器组件
 * 支持基本四则运算
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: number
  currencySymbol?: string
  showSaveButton?: boolean
  saveButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  currencySymbol: '¥',
  showSaveButton: true,
  saveButtonText: 'Save'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'save': [value: number]
}>()

// 显示值
const display = ref('0')
// 待处理的运算符
const operator = ref<'+' | '-' | '×' | '÷' | null>(null)
// 存储的第一个操作数
const firstOperand = ref<number | null>(null)
// 是否刚完成计算
const justCalculated = ref(false)

// 当前数值
const currentValue = computed(() => parseFloat(display.value) || 0)

// 格式化显示
const formattedDisplay = computed(() => {
  const value = parseFloat(display.value) || 0
  return `${props.currencySymbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`
})

// 显示计算表达式
const expression = computed(() => {
  if (operator.value && firstOperand.value !== null) {
    return `${props.currencySymbol}${firstOperand.value.toLocaleString()} ${operator.value}`
  }
  return ''
})

// 同步外部值
watch(() => props.modelValue, (newVal) => {
  if (newVal !== currentValue.value && !operator.value) {
    display.value = newVal.toString()
  }
}, { immediate: true })

// 输出值变化
watch(currentValue, (val) => {
  emit('update:modelValue', val)
})

// 键盘按键定义
const keys = [
  { label: 'C', type: 'clear', value: 'C' },
  { label: '÷', type: 'operator', value: '÷' },
  { label: '×', type: 'operator', value: '×' },
  { label: 'backspace', type: 'backspace', value: 'backspace', icon: true },
  { label: '7', type: 'number', value: '7' },
  { label: '8', type: 'number', value: '8' },
  { label: '9', type: 'number', value: '9' },
  { label: '-', type: 'operator', value: '-' },
  { label: '4', type: 'number', value: '4' },
  { label: '5', type: 'number', value: '5' },
  { label: '6', type: 'number', value: '6' },
  { label: '+', type: 'operator', value: '+' },
  { label: '1', type: 'number', value: '1' },
  { label: '2', type: 'number', value: '2' },
  { label: '3', type: 'number', value: '3' },
  { label: '=', type: 'equals', value: '=' },
  { label: '0', type: 'number', value: '0', span: 2 },
  { label: '.', type: 'decimal', value: '.' }
]

// 执行计算
function calculate(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b
    case '-': return Math.max(0, a - b)
    case '×': return a * b
    case '÷': return b !== 0 ? a / b : 0
    default: return b
  }
}

// 处理按键
function handleKey(key: typeof keys[0]) {
  switch (key.type) {
    case 'number':
      if (justCalculated.value) {
        display.value = key.value
        justCalculated.value = false
      } else if (display.value === '0') {
        display.value = key.value
      } else {
        display.value += key.value
      }
      break

    case 'decimal':
      if (justCalculated.value) {
        display.value = '0.'
        justCalculated.value = false
      } else if (!display.value.includes('.')) {
        display.value += '.'
      }
      break

    case 'operator':
      if (firstOperand.value !== null && operator.value) {
        // 链式运算
        const result = calculate(firstOperand.value, operator.value, currentValue.value)
        display.value = result.toString()
        firstOperand.value = result
      } else {
        firstOperand.value = currentValue.value
      }
      operator.value = key.value as '+' | '-' | '×' | '÷'
      justCalculated.value = true
      break

    case 'equals':
      if (firstOperand.value !== null && operator.value) {
        const result = calculate(firstOperand.value, operator.value, currentValue.value)
        display.value = result.toString()
        firstOperand.value = null
        operator.value = null
        justCalculated.value = true
      }
      break

    case 'backspace':
      if (display.value.length > 1) {
        display.value = display.value.slice(0, -1)
      } else {
        display.value = '0'
      }
      justCalculated.value = false
      break

    case 'clear':
      display.value = '0'
      firstOperand.value = null
      operator.value = null
      justCalculated.value = false
      break
  }
}

// 保存
function handleSave() {
  // 先完成未完成的计算
  if (firstOperand.value !== null && operator.value) {
    const result = calculate(firstOperand.value, operator.value, currentValue.value)
    display.value = result.toString()
    firstOperand.value = null
    operator.value = null
  }
  emit('save', currentValue.value)
}

// 键盘事件处理
function handleKeyDown(e: KeyboardEvent) {
  // 如果焦点在输入框中，不处理
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return
  }

  // 数字键 0-9
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault()
    handleKey({ label: e.key, type: 'number', value: e.key })
    return
  }

  // 小数点
  if (e.key === '.' || e.key === ',') {
    e.preventDefault()
    handleKey({ label: '.', type: 'decimal', value: '.' })
    return
  }

  // 运算符
  const operatorMap: Record<string, string> = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷',
    'x': '×',
    'X': '×'
  }
  if (operatorMap[e.key]) {
    e.preventDefault()
    handleKey({ label: operatorMap[e.key], type: 'operator', value: operatorMap[e.key] })
    return
  }

  // 等号/回车 - 保存
  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault()
    // 如果有未完成的计算先完成，否则直接保存
    if (firstOperand.value !== null && operator.value) {
      handleKey({ label: '=', type: 'equals', value: '=' })
    } else {
      handleSave()
    }
    return
  }

  // 退格键
  if (e.key === 'Backspace') {
    e.preventDefault()
    handleKey({ label: 'backspace', type: 'backspace', value: 'backspace', icon: true })
    return
  }

  // 清除键
  if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
    e.preventDefault()
    handleKey({ label: 'C', type: 'clear', value: 'C' })
    return
  }
}

// 挂载/卸载时添加/移除键盘监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="calculator">
    <!-- 显示区域 -->
    <div class="calculator-display">
      <div v-if="expression" class="expression">{{ expression }}</div>
      <div class="value">{{ formattedDisplay }}</div>
    </div>

    <!-- 键盘区域 -->
    <div class="calculator-keypad">
      <button
        v-for="key in keys"
        :key="key.value"
        class="calc-key"
        :class="[
          key.type,
          { 'span-2': key.span === 2 }
        ]"
        @click="handleKey(key)"
      >
        <span v-if="key.icon" class="material-symbols-outlined">{{ key.label }}</span>
        <span v-else>{{ key.label }}</span>
      </button>
      
      <!-- 保存按钮 -->
      <button 
        v-if="showSaveButton"
        class="calc-key save"
        @click="handleSave"
      >
        {{ saveButtonText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

/* 显示区域 */
.calculator-display {
  text-align: right;
  padding: 16px;
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  border-radius: 12px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.expression {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-strong);
  font-variant-numeric: tabular-nums;
}

/* 键盘区域 */
.calculator-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.calc-key {
  aspect-ratio: 1;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: var(--color-background);
  color: var(--color-text-strong);
  border: 1px solid var(--color-border);
}

.calc-key:hover {
  transform: scale(1.05);
  border-color: var(--color-primary);
}

.calc-key:active {
  transform: scale(0.95);
}

/* 数字键 */
.calc-key.number {
  background: var(--color-background);
}

/* 运算符键 */
.calc-key.operator,
.calc-key.equals {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
}

.calc-key.operator:hover,
.calc-key.equals:hover {
  background: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

/* 清除键 */
.calc-key.clear {
  background: color-mix(in srgb, var(--color-expense) 15%, transparent);
  color: var(--color-expense);
  border-color: color-mix(in srgb, var(--color-expense) 30%, transparent);
}

.calc-key.clear:hover {
  background: color-mix(in srgb, var(--color-expense) 25%, transparent);
}

/* 退格键 */
.calc-key.backspace {
  background: var(--color-background);
}

.calc-key.backspace .material-symbols-outlined {
  font-size: 1.25rem;
}

/* 跨列 */
.calc-key.span-2 {
  grid-column: span 2;
  border-radius: 9999px;
  aspect-ratio: unset;
  height: 100%;
}

/* 保存按钮 */
.calc-key.save {
  grid-column: span 4;
  aspect-ratio: unset;
  height: 56px;
  border-radius: 9999px;
  background: var(--color-primary);
  color: white;
  font-size: 1.125rem;
  border: none;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.calc-key.save:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--color-primary) 50%, transparent);
}

.calc-key.save:active {
  transform: translateY(0);
}

/* 小屏适配 */
@media (max-width: 400px) {
  .calculator {
    padding: 12px;
  }
  
  .calculator-keypad {
    gap: 8px;
  }
  
  .calc-key {
    font-size: 1rem;
  }
  
  .value {
    font-size: 1.5rem;
  }
}
</style>
