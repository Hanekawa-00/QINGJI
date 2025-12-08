<script setup lang="ts">
/**
 * 移动端记账页面
 * 紧凑布局，底部固定小键盘
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Popup as VanPopup,
  DatePicker as VanDatePicker,
  Picker as VanPicker,
  showToast
} from 'vant'
import 'vant/es/popup/style'
import 'vant/es/date-picker/style'
import 'vant/es/picker/style'
import 'vant/es/toast/style'

import { useUserStore } from '@/stores/user.store'
import { useCurrencyStore } from '@/stores/currency.store'
import type { TransactionType, Category, CurrencyCode } from '@/types'

defineOptions({ name: 'MobileEntry' })

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

// ==================== 状态 ====================

// 编辑模式
const editingId = ref<string | null>(null)
const isEditMode = computed(() => !!editingId.value)

// 表单数据
const transactionType = ref<TransactionType>('expense')
const displayValue = ref('0')
const selectedCategory = ref<Category | null>(null)
const description = ref('')
const selectedDate = ref(new Date())

// 币种相关
const selectedCurrency = ref<CurrencyCode>('USD')
const exchangeRate = ref(1)

// 弹出层
const showDatePicker = ref(false)
const showCurrencyPicker = ref(false)
const showCategoryManager = ref(false)

// 分类管理
const newCategoryName = ref('')

// 计算器状态
const operator = ref<'+' | '-' | null>(null)
const firstOperand = ref<number | null>(null)
const justCalculated = ref(false)

// ==================== 计算属性 ====================

// 当前数值
const currentAmount = computed(() => parseFloat(displayValue.value) || 0)

// 分类列表
const categories = computed(() => 
  userStore.categories.filter((c: Category) => c.type === transactionType.value)
)

// 币种选项
const currencyColumns = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    text: `${c.flag} ${c.code}`,
    value: c.code
  }))
)

// 当前币种显示
const currencyDisplay = computed(() => {
  const c = currencyStore.availableCurrencies.find(c => c.code === selectedCurrency.value)
  return c ? `${c.flag} ${c.code}` : selectedCurrency.value
})

// 是否为非主币种
const isNonPrimaryCurrency = computed(() => 
  selectedCurrency.value !== currencyStore.primaryCurrency
)

// 转换后金额
const convertedAmount = computed(() => {
  if (!currentAmount.value || !isNonPrimaryCurrency.value) return 0
  return currentAmount.value * exchangeRate.value
})

// 格式化日期显示
const displayDate = computed(() => {
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return selectedDate.value.toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric'
  })
})

// 计算表达式显示
const expressionDisplay = computed(() => {
  if (operator.value && firstOperand.value !== null) {
    return `${firstOperand.value} ${operator.value}`
  }
  return ''
})

// ==================== 初始化 ====================

onMounted(() => {
  currencyStore.initialize()
  selectedCurrency.value = currencyStore.primaryCurrency
  
  // 检查编辑模式
  const id = route.query.id as string
  if (id) {
    const transaction = userStore.transactions.find(t => t.id === id)
    if (transaction) {
      editingId.value = id
      transactionType.value = transaction.type
      displayValue.value = String(transaction.amount)
      description.value = transaction.description || ''
      selectedDate.value = new Date(transaction.date)
      selectedCurrency.value = transaction.currency as CurrencyCode
      exchangeRate.value = transaction.exchangeRate || 1
      
      const cat = userStore.categories.find(c => c.name === transaction.category)
      if (cat) selectedCategory.value = cat
    }
  }
})

// 监听主币种变化
watch(() => currencyStore.primaryCurrency, (newVal) => {
  if (newVal && selectedCurrency.value === 'USD') {
    selectedCurrency.value = newVal
  }
}, { immediate: true })

// 监听币种变化
watch(selectedCurrency, async (newCurrency) => {
  if (newCurrency === currencyStore.primaryCurrency) {
    exchangeRate.value = 1
    return
  }
  try {
    exchangeRate.value = currencyStore.getRate(newCurrency, currencyStore.primaryCurrency)
  } catch {
    exchangeRate.value = 1
  }
})

// 类型切换时重置分类
watch(transactionType, () => {
  selectedCategory.value = null
})

// ==================== 计算器逻辑 ====================

function calculate(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b
    case '-': return Math.max(0, a - b)
    default: return b
  }
}

function onKeyInput(key: string) {
  if (key === '.' && displayValue.value.includes('.')) return
  if (displayValue.value.includes('.') && displayValue.value.split('.')[1]?.length >= 2) return
  
  if (justCalculated.value && /[0-9]/.test(key)) {
    displayValue.value = key
    justCalculated.value = false
  } else if (displayValue.value === '0' && key !== '.') {
    displayValue.value = key
  } else {
    displayValue.value += key
  }
}

function onKeyDelete() {
  if (displayValue.value.length > 1) {
    displayValue.value = displayValue.value.slice(0, -1)
  } else {
    displayValue.value = '0'
  }
  justCalculated.value = false
}

function onKeyClear() {
  displayValue.value = '0'
  firstOperand.value = null
  operator.value = null
  justCalculated.value = false
}

function onKeyOperator(op: '+' | '-') {
  if (firstOperand.value !== null && operator.value) {
    const result = calculate(firstOperand.value, operator.value, currentAmount.value)
    displayValue.value = result.toString()
    firstOperand.value = result
  } else {
    firstOperand.value = currentAmount.value
  }
  operator.value = op
  justCalculated.value = true
}

function onKeyEquals() {
  if (firstOperand.value !== null && operator.value) {
    const result = calculate(firstOperand.value, operator.value, currentAmount.value)
    displayValue.value = result.toString()
    firstOperand.value = null
    operator.value = null
    justCalculated.value = true
  }
}

// ==================== 事件处理 ====================

const goBack = () => router.back()

const onCurrencyConfirm = ({ selectedOptions }: any) => {
  const selected = selectedOptions[0]?.value as CurrencyCode
  if (selected) selectedCurrency.value = selected
  showCurrencyPicker.value = false
}

const onDateConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  const [year, month, day] = selectedValues
  selectedDate.value = new Date(Number(year), Number(month) - 1, Number(day))
  showDatePicker.value = false
}

const selectCategory = (cat: Category) => {
  selectedCategory.value = cat
}

// 添加分类
const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) {
    showToast(t('messages.enterCategoryName'))
    return
  }
  await userStore.addCategory({
    name: newCategoryName.value,
    icon: 'category',
    type: transactionType.value
  })
  showToast(t('messages.categoryAdded'))
  newCategoryName.value = ''
}

// 删除分类
const handleDeleteCategory = async (categoryId: string) => {
  const success = await userStore.deleteCategory(categoryId)
  if (success) {
    showToast(t('messages.categoryDeleted'))
    if (selectedCategory.value?.id === categoryId) {
      selectedCategory.value = null
    }
  } else {
    showToast(t('messages.cannotDeleteCategory'))
  }
}

// 提交
const handleSubmit = async () => {
  // 先完成计算
  if (firstOperand.value !== null && operator.value) {
    onKeyEquals()
  }
  
  const amount = parseFloat(displayValue.value)
  if (!amount || amount <= 0) {
    showToast(t('entry.amountRequired'))
    return
  }
  if (!selectedCategory.value) {
    showToast(t('entry.categoryRequired'))
    return
  }

  try {
    const converted = isNonPrimaryCurrency.value ? amount * exchangeRate.value : amount
    
    const transactionData = {
      type: transactionType.value,
      amount,
      currency: selectedCurrency.value,
      convertedAmount: converted,
      exchangeRate: exchangeRate.value,
      category: selectedCategory.value.name,
      categoryIcon: selectedCategory.value.icon,
      description: description.value,
      date: selectedDate.value.toISOString().split('T')[0]
    }
    
    if (isEditMode.value && editingId.value) {
      await userStore.updateTransaction(editingId.value, transactionData)
      showToast(t('common.updated'))
    } else {
      await userStore.addTransaction(transactionData)
      showToast(t('common.saved'))
    }
    
    router.push({ name: 'MobileDashboard' })
  } catch {
    showToast(t('common.error'))
  }
}
</script>

<template>
  <div class="m-entry">
    <!-- 顶部栏：类型切换 + 币种 -->
    <header class="m-entry-header">
      <button class="m-close-btn" @click="goBack">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="m-type-tabs">
        <button 
          :class="['m-type-btn', { active: transactionType === 'expense' }]"
          @click="transactionType = 'expense'"
        >{{ t('reports.expense') }}</button>
        <button 
          :class="['m-type-btn', { active: transactionType === 'income' }]"
          @click="transactionType = 'income'"
        >{{ t('reports.income') }}</button>
      </div>
      <button class="m-more-btn" @click="showCurrencyPicker = true">
        <span class="currency-text">{{ currencyDisplay }}</span>
      </button>
    </header>

    <!-- 金额显示区 -->
    <div class="m-amount-area">
      <div v-if="expressionDisplay" class="m-expression">{{ expressionDisplay }}</div>
      <div class="m-amount-row">
        <span class="m-amount-value">{{ displayValue }}</span>
      </div>
      <div v-if="isNonPrimaryCurrency && currentAmount" class="m-convert-hint">
        ≈ {{ currencyStore.formatAmount(convertedAmount) }}
      </div>
    </div>

    <!-- 分类选择区域（可滚动） -->
    <div class="m-category-scroll">
      <div class="m-category-grid">
        <div 
          v-for="cat in categories" 
          :key="cat.id"
          :class="['m-cat-item', { active: selectedCategory?.id === cat.id }]"
          @click="selectCategory(cat)"
        >
          <span class="material-symbols-outlined">{{ cat.icon }}</span>
          <span class="m-cat-name">{{ cat.name }}</span>
        </div>
        <!-- 分类管理按钮 -->
        <div class="m-cat-item m-cat-manage" @click="showCategoryManager = true">
          <span class="material-symbols-outlined">settings</span>
          <span class="m-cat-name">{{ t('entry.manageCategories') }}</span>
        </div>
      </div>
    </div>

    <!-- 固定底部区域：备注 + 日期 + 键盘 -->
    <div class="m-bottom-fixed">
      <!-- 备注和日期 -->
      <div class="m-input-row">
        <div class="m-note-field">
          <span class="material-symbols-outlined">edit_note</span>
          <input 
            v-model="description"
            type="text"
            :placeholder="t('entry.notePlaceholder')"
          />
        </div>
        <button class="m-date-btn" @click="showDatePicker = true">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>{{ displayDate }}</span>
        </button>
      </div>

      <!-- 键盘 -->
      <div class="m-keypad-grid">
        <button class="m-key" @click="onKeyInput('1')">1</button>
        <button class="m-key" @click="onKeyInput('2')">2</button>
        <button class="m-key" @click="onKeyInput('3')">3</button>
        <button class="m-key m-key-op" @click="onKeyDelete">
          <span class="material-symbols-outlined">backspace</span>
        </button>
        <button class="m-key" @click="onKeyInput('4')">4</button>
        <button class="m-key" @click="onKeyInput('5')">5</button>
        <button class="m-key" @click="onKeyInput('6')">6</button>
        <button class="m-key m-key-op" @click="onKeyOperator('+')">+</button>
        <button class="m-key" @click="onKeyInput('7')">7</button>
        <button class="m-key" @click="onKeyInput('8')">8</button>
        <button class="m-key" @click="onKeyInput('9')">9</button>
        <button class="m-key m-key-op" @click="onKeyOperator('-')">−</button>
        <button class="m-key" @click="onKeyInput('.')">.</button>
        <button class="m-key" @click="onKeyInput('0')">0</button>
        <button class="m-key m-key-clear" @click="onKeyClear">C</button>
        <button 
          class="m-key m-key-save" 
          :disabled="!currentAmount || !selectedCategory"
          @click="handleSubmit"
        >
          <span class="material-symbols-outlined">check</span>
        </button>
      </div>
    </div>

    <!-- 分类管理弹窗 -->
    <van-popup v-model:show="showCategoryManager" position="bottom" round :style="{ height: '60%' }">
      <div class="m-cat-manager">
        <div class="m-manager-header">
          <span>{{ t('entry.manageCategories') }}</span>
          <button @click="showCategoryManager = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <!-- 分类列表 -->
        <div class="m-manager-list">
          <div 
            v-for="cat in categories" 
            :key="cat.id"
            class="m-manager-item"
          >
            <span class="material-symbols-outlined">{{ cat.icon }}</span>
            <span class="m-manager-name">{{ cat.name }}</span>
            <button class="m-manager-del" @click="handleDeleteCategory(cat.id)">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
        
        <!-- 添加新分类 -->
        <div class="m-add-cat-row">
          <input 
            v-model="newCategoryName"
            type="text"
            :placeholder="t('entry.categoryName')"
          />
          <button class="m-add-btn" @click="handleAddCategory">
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker 
        :title="t('entry.selectDate')"
        :min-date="new Date(2020, 0, 1)"
        :max-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
    
    <!-- 币种选择器 -->
    <van-popup v-model:show="showCurrencyPicker" position="bottom" round>
      <van-picker
        :columns="currencyColumns"
        @confirm="onCurrencyConfirm"
        @cancel="showCurrencyPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.m-entry {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
  /* 阻止父容器滚动 */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 顶部栏 */
.m-entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + var(--safe-area-inset-top, 0px));
  gap: 8px;
  flex-shrink: 0;
}

.m-close-btn,
.m-more-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.m-close-btn .material-symbols-outlined {
  font-size: 20px;
}

.m-more-btn {
  width: auto;
  padding: 0 10px;
  border-radius: 18px;
}

.currency-text {
  font-size: 12px;
  font-weight: 500;
}

.m-type-tabs {
  display: flex;
  height: 32px;
  padding: 3px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.m-type-btn {
  padding: 0 16px;
  border-radius: 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.m-type-btn.active {
  background: var(--color-primary);
  color: white;
}

/* 金额显示 */
.m-amount-area {
  padding: 12px 16px 8px;
  text-align: center;
  flex-shrink: 0;
}

.m-expression {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.m-amount-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-amount-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-strong);
  letter-spacing: -1px;
}

.m-convert-hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 分类滚动区域 */
.m-category-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  -webkit-overflow-scrolling: touch;
}

.m-category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.m-cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
}

.m-cat-item:active {
  transform: scale(0.95);
}

.m-cat-item.active {
  background: var(--color-primary-alpha-20);
  border-color: var(--color-primary);
}

.m-cat-item .material-symbols-outlined {
  font-size: 22px;
  color: var(--color-text-muted);
}

.m-cat-item.active .material-symbols-outlined {
  color: var(--color-primary);
}

.m-cat-name {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-strong);
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-cat-manage {
  border-style: dashed;
}

.m-cat-manage .material-symbols-outlined {
  color: var(--color-text-muted);
}

/* 固定底部区域 */
.m-bottom-fixed {
  flex-shrink: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 8px 12px;
  padding-bottom: calc(8px + var(--safe-area-inset-bottom, 0px));
}

.m-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.m-note-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.m-note-field .material-symbols-outlined {
  font-size: 18px;
  color: var(--color-text-muted);
}

.m-note-field input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text-strong);
  outline: none;
}

.m-note-field input::placeholder {
  color: var(--color-text-muted);
}

.m-date-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

.m-date-btn .material-symbols-outlined {
  font-size: 16px;
}

/* 键盘 */
.m-keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.m-key {
  height: 44px;
  border-radius: 10px;
  background: var(--color-background);
  border: none;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}

.m-key:active {
  background: var(--color-surface-hover);
}

.m-key-op {
  color: var(--color-primary);
  font-size: 20px;
}

.m-key-op .material-symbols-outlined {
  font-size: 18px;
}

.m-key-clear {
  color: var(--color-expense);
  font-weight: 600;
}

.m-key-save {
  background: var(--color-primary);
  color: white;
}

.m-key-save:disabled {
  opacity: 0.4;
}

.m-key-save .material-symbols-outlined {
  font-size: 22px;
}

/* 分类管理弹窗 */
.m-cat-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.m-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.m-manager-header span {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.m-manager-header button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.m-manager-header button .material-symbols-outlined {
  font-size: 18px;
}

.m-manager-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.m-manager-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface);
  border-radius: 10px;
  border: 1px solid var(--color-border);
}

.m-manager-item .material-symbols-outlined {
  font-size: 22px;
  color: var(--color-text-muted);
}

.m-manager-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-strong);
}

.m-manager-del {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-expense);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.m-manager-del .material-symbols-outlined {
  font-size: 20px;
}

.m-add-cat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.m-add-cat-row input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 14px;
  color: var(--color-text-strong);
  outline: none;
}

.m-add-cat-row input::placeholder {
  color: var(--color-text-muted);
}

.m-add-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--color-primary);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.m-add-btn .material-symbols-outlined {
  font-size: 22px;
}
</style>
