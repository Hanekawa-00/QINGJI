<script setup lang="ts">
/**
 * 统一计算器组件
 * 支持桌面端和移动端，四则运算
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: number
  currencySymbol?: string
  showSaveButton?: boolean
  saveButtonText?: string
  saveDisabled?: boolean
  compact?: boolean // 紧凑模式（移动端）
  showDisplay?: boolean // 是否显示顶部显示区
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  currencySymbol: '¥',
  showSaveButton: true,
  saveButtonText: 'Save',
  saveDisabled: false,
  compact: false,
  showDisplay: true
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

// 格式化显示（带货币符号）
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

// 输入数字
function inputNumber(num: string) {
  // 限制小数位数
  if (display.value.includes('.') && display.value.split('.')[1]?.length >= 2) return
  
  if (justCalculated.value) {
    display.value = num
    justCalculated.value = false
  } else if (display.value === '0') {
    display.value = num
  } else {
    display.value += num
  }
}

// 输入小数点
function inputDecimal() {
  if (display.value.includes('.')) return
  if (justCalculated.value) {
    display.value = '0.'
    justCalculated.value = false
  } else {
    display.value += '.'
  }
}

// 输入运算符
function inputOperator(op: '+' | '-' | '×' | '÷') {
  if (firstOperand.value !== null && operator.value) {
    const result = calculate(firstOperand.value, operator.value, currentValue.value)
    display.value = result.toString()
    firstOperand.value = result
  } else {
    firstOperand.value = currentValue.value
  }
  operator.value = op
  justCalculated.value = true
}

// 计算等于
function inputEquals() {
  if (firstOperand.value !== null && operator.value) {
    const result = calculate(firstOperand.value, operator.value, currentValue.value)
    display.value = result.toString()
    firstOperand.value = null
    operator.value = null
    justCalculated.value = true
  }
}

// 退格
function inputBackspace() {
  if (display.value.length > 1) {
    display.value = display.value.slice(0, -1)
  } else {
    display.value = '0'
  }
  justCalculated.value = false
}

// 清除
function inputClear() {
  display.value = '0'
  firstOperand.value = null
  operator.value = null
  justCalculated.value = false
}

// 保存
function handleSave() {
  if (props.saveDisabled) return
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
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault()
    inputNumber(e.key)
    return
  }

  if (e.key === '.' || e.key === ',') {
    e.preventDefault()
    inputDecimal()
    return
  }

  const opMap: Record<string, '+' | '-' | '×' | '÷'> = {
    '+': '+', '-': '-', '*': '×', '/': '÷', 'x': '×', 'X': '×'
  }
  if (opMap[e.key]) {
    e.preventDefault()
    inputOperator(opMap[e.key])
    return
  }

  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault()
    if (firstOperand.value !== null && operator.value) {
      inputEquals()
    } else {
      handleSave()
    }
    return
  }

  if (e.key === 'Backspace') {
    e.preventDefault()
    inputBackspace()
    return
  }

  if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
    e.preventDefault()
    inputClear()
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 暴露方法供外部调用
defineExpose({
  display,
  expression,
  formattedDisplay,
  currentValue,
  inputClear
})
</script>

<template>
  <div class="calculator" :class="{ compact }">
    <!-- 显示区域（可选） -->
    <div v-if="showDisplay" class="calc-display">
      <div v-if="expression" class="calc-expression">{{ expression }}</div>
      <div class="calc-value">{{ formattedDisplay }}</div>
    </div>

    <!-- 键盘区域 -->
    <div class="calc-keypad">
      <!-- 第一行：C ÷ × ⌫ -->
      <button class="calc-key clear" @click="inputClear">C</button>
      <button class="calc-key operator" @click="inputOperator('÷')">÷</button>
      <button class="calc-key operator" @click="inputOperator('×')">×</button>
      <button class="calc-key backspace" @click="inputBackspace">
        <span class="material-symbols-outlined">backspace</span>
      </button>
      
      <!-- 第二行：7 8 9 - -->
      <button class="calc-key number" @click="inputNumber('7')">7</button>
      <button class="calc-key number" @click="inputNumber('8')">8</button>
      <button class="calc-key number" @click="inputNumber('9')">9</button>
      <button class="calc-key operator" @click="inputOperator('-')">−</button>
      
      <!-- 第三行：4 5 6 + -->
      <button class="calc-key number" @click="inputNumber('4')">4</button>
      <button class="calc-key number" @click="inputNumber('5')">5</button>
      <button class="calc-key number" @click="inputNumber('6')">6</button>
      <button class="calc-key operator" @click="inputOperator('+')">+</button>
      
      <!-- 第四行：1 2 3 = -->
      <button class="calc-key number" @click="inputNumber('1')">1</button>
      <button class="calc-key number" @click="inputNumber('2')">2</button>
      <button class="calc-key number" @click="inputNumber('3')">3</button>
      <button class="calc-key equals" @click="inputEquals">=</button>
      
      <!-- 第五行：. 0 保存 -->
      <button class="calc-key decimal" @click="inputDecimal">.</button>
      <button class="calc-key number" @click="inputNumber('0')">0</button>
      <button 
        v-if="showSaveButton"
        class="calc-key save"
        :disabled="saveDisabled"
        @click="handleSave"
      >
        <span v-if="compact" class="material-symbols-outlined">check</span>
        <span v-else>{{ saveButtonText }}</span>
      </button>
      <!-- 如果不显示保存按钮，补充空位 -->
      <div v-else class="calc-key-placeholder" />
      <div v-if="!showSaveButton" class="calc-key-placeholder" />
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

/* 紧凑模式 */
.calculator.compact {
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  gap: 0;
}

/* ===== 显示区域 ===== */
.calc-display {
  text-align: right;
  padding: 16px;
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  border-radius: 12px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.compact .calc-display {
  padding: 12px;
  min-height: 60px;
  border-radius: 10px;
  margin-bottom: 8px;
}

.calc-expression {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.calc-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-strong);
  font-variant-numeric: tabular-nums;
}

.compact .calc-value {
  font-size: 1.5rem;
}

/* ===== 键盘区域 ===== */
.calc-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.compact .calc-keypad {
  gap: 6px;
}

/* ===== 按键基础样式 ===== */
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

.compact .calc-key {
  aspect-ratio: unset;
  height: 44px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 500;
  border: none;
}

.calc-key:hover {
  transform: scale(1.05);
  border-color: var(--color-primary);
}

.compact .calc-key:hover {
  transform: none;
}

.calc-key:active {
  transform: scale(0.95);
}

.compact .calc-key:active {
  transform: none;
  background: var(--color-surface-hover);
}

/* ===== 数字键 ===== */
.calc-key.number,
.calc-key.decimal {
  background: var(--color-background);
}

/* ===== 运算符键 ===== */
.calc-key.operator,
.calc-key.equals {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  font-size: 1.5rem;
}

.compact .calc-key.operator,
.compact .calc-key.equals {
  background: var(--color-background);
  font-size: 20px;
}

.calc-key.operator:hover,
.calc-key.equals:hover {
  background: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

/* ===== 清除键 ===== */
.calc-key.clear {
  background: color-mix(in srgb, var(--color-expense) 15%, transparent);
  color: var(--color-expense);
  border-color: color-mix(in srgb, var(--color-expense) 30%, transparent);
}

.compact .calc-key.clear {
  background: var(--color-background);
  font-weight: 600;
}

.calc-key.clear:hover {
  background: color-mix(in srgb, var(--color-expense) 25%, transparent);
}

/* ===== 退格键 ===== */
.calc-key.backspace {
  background: var(--color-background);
}

.calc-key.backspace .material-symbols-outlined {
  font-size: 1.25rem;
}

.compact .calc-key.backspace .material-symbols-outlined {
  font-size: 18px;
}

/* ===== 保存按钮 ===== */
.calc-key.save {
  grid-column: span 2;
  aspect-ratio: unset;
  border-radius: 9999px;
  background: var(--color-primary);
  color: white;
  font-size: 1.125rem;
  border: none;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.compact .calc-key.save {
  height: 44px;
  border-radius: 10px;
  box-shadow: none;
  font-size: 22px;
}

.calc-key.save:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--color-primary) 50%, transparent);
}

.compact .calc-key.save:hover {
  transform: none;
}

.calc-key.save:active {
  transform: translateY(0);
}

.calc-key.save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.calc-key.save:disabled:hover {
  transform: none;
}

/* 占位符 */
.calc-key-placeholder {
  visibility: hidden;
}
</style>
