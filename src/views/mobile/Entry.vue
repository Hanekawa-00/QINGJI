<script setup lang="ts">
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

// 编辑模式
const editingId = ref<string | null>(null)
const isEditMode = computed(() => !!editingId.value)

// 返回上一页
const goBack = () => router.back()

// 表单数据
const transactionType = ref<TransactionType>('expense')
const amount = ref('')
const selectedCategory = ref<Category | null>(null)
const description = ref('')
const selectedDate = ref(new Date())

// 多币种支持
const selectedCurrency = ref<CurrencyCode>('USD')
const exchangeRate = ref(1)
const showCurrencyPicker = ref(false)

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
  if (!amount.value || !isNonPrimaryCurrency.value) return 0
  return parseFloat(amount.value) * exchangeRate.value
})

// 初始化
onMounted(() => {
  currencyStore.initialize()
  selectedCurrency.value = currencyStore.primaryCurrency
  
  // 检查是否为编辑模式
  const id = route.query.id as string
  if (id) {
    const transaction = userStore.transactions.find(t => t.id === id)
    if (transaction) {
      editingId.value = id
      transactionType.value = transaction.type
      amount.value = String(transaction.amount)
      description.value = transaction.description || ''
      selectedDate.value = new Date(transaction.date)
      selectedCurrency.value = transaction.currency as CurrencyCode
      exchangeRate.value = transaction.exchangeRate || 1
      
      // 查找对应的分类
      const cat = userStore.categories.find(c => c.name === transaction.category)
      if (cat) {
        selectedCategory.value = cat
      }
    }
  }
})

// 监听主币种变化
watch(() => currencyStore.primaryCurrency, (newVal) => {
  if (newVal && selectedCurrency.value === 'USD') {
    selectedCurrency.value = newVal
  }
}, { immediate: true })

// 监听币种变化，自动获取汇率
watch(selectedCurrency, async (newCurrency) => {
  if (newCurrency === currencyStore.primaryCurrency) {
    exchangeRate.value = 1
    return
  }
  
  try {
    const rate = currencyStore.getRate(newCurrency, currencyStore.primaryCurrency)
    exchangeRate.value = rate
  } catch {
    exchangeRate.value = 1
  }
})

// 币种选择确认
const onCurrencyConfirm = ({ selectedOptions }: any) => {
  const selected = selectedOptions[0]?.value as CurrencyCode
  if (selected) {
    selectedCurrency.value = selected
  }
  showCurrencyPicker.value = false
}

// 弹出层控制
const showDatePicker = ref(false)

// 根据类型获取分类
const categories = computed(() => 
  userStore.categories.filter((c: Category) => c.type === transactionType.value)
)

// 切换类型时重置分类
watch(transactionType, () => {
  selectedCategory.value = null
})

// 格式化日期显示
const displayDate = computed(() => {
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return selectedDate.value.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

// 数字键盘输入
const onKeyInput = (key: string) => {
  if (key === '.' && amount.value.includes('.')) return
  if (amount.value.includes('.') && amount.value.split('.')[1]?.length >= 2) return
  amount.value += key
}

const onKeyDelete = () => {
  amount.value = amount.value.slice(0, -1)
}

// 日期选择确认
const onDateConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  const [year, month, day] = selectedValues
  selectedDate.value = new Date(Number(year), Number(month) - 1, Number(day))
  showDatePicker.value = false
}

// 提交
const handleSubmit = async () => {
  // 验证
  if (!amount.value || parseFloat(amount.value) <= 0) {
    showToast(t('entry.amountRequired'))
    return
  }
  if (!selectedCategory.value) {
    showToast(t('entry.categoryRequired'))
    return
  }

  try {
    const amountValue = parseFloat(amount.value)
    const converted = isNonPrimaryCurrency.value 
      ? amountValue * exchangeRate.value 
      : amountValue
    
    const transactionData = {
      type: transactionType.value,
      amount: amountValue,
      currency: selectedCurrency.value,
      convertedAmount: converted,
      exchangeRate: exchangeRate.value,
      category: selectedCategory.value.name,
      categoryIcon: selectedCategory.value.icon,
      description: description.value,
      date: selectedDate.value.toISOString().split('T')[0]
    }
    
    if (isEditMode.value && editingId.value) {
      // 更新已有交易
      await userStore.updateTransaction(editingId.value, transactionData)
      showToast(t('common.updated'))
    } else {
      // 添加新交易
      await userStore.addTransaction(transactionData)
      showToast(t('common.saved'))
    }
    
    // 跳转到首页
    router.push({ name: 'MobileDashboard' })
  } catch (error) {
    showToast(t('common.error'))
  }
}
</script>

<template>
  <div class="mobile-entry">
    <!-- 顶部导航 -->
    <header class="entry-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">close</span>
      </button>
      <span class="header-title">{{ isEditMode ? t('entry.editTransaction') : t('nav.newEntry') }}</span>
      <div class="header-spacer" />
    </header>

    <!-- 类型切换（Pill 样式） -->
    <div class="type-switch-wrapper">
      <div class="type-switch">
        <label class="type-option" :class="{ active: transactionType === 'expense' }">
          <input type="radio" v-model="transactionType" value="expense" />
          <span>{{ t('reports.expense') }}</span>
        </label>
        <label class="type-option" :class="{ active: transactionType === 'income' }">
          <input type="radio" v-model="transactionType" value="income" />
          <span>{{ t('reports.income') }}</span>
        </label>
      </div>
    </div>

    <!-- 金额显示 -->
    <div class="amount-section">
      <h1 class="amount-display">
        <button class="currency-btn" @click="showCurrencyPicker = true">
          {{ currencyDisplay }}
          <span class="material-symbols-outlined">expand_more</span>
        </button>
        <span class="value">{{ amount || '0' }}</span>
      </h1>
      <!-- 汇率转换提示 -->
      <p v-if="isNonPrimaryCurrency && amount" class="convert-hint">
        ≈ {{ currencyStore.primaryCurrency }} {{ convertedAmount.toFixed(2) }}
        <span class="rate">(1 {{ selectedCurrency }} = {{ exchangeRate.toFixed(4) }} {{ currencyStore.primaryCurrency }})</span>
      </p>
    </div>

    <!-- 分类选择 -->
    <div class="category-section">
      <p class="section-title">{{ t('entry.selectCategory') }}</p>
      <div class="category-grid">
        <div 
          v-for="cat in categories" 
          :key="cat.id"
          class="category-item"
          :class="{ active: selectedCategory?.id === cat.id }"
          @click="selectedCategory = cat"
        >
          <span class="material-symbols-outlined">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 备注和快捷操作 -->
    <div class="notes-section">
      <input 
        v-model="description"
        type="text"
        class="note-input"
        :placeholder="t('entry.notePlaceholder')"
        maxlength="100"
      />
      <div class="quick-actions">
        <button class="quick-btn" @click="showDatePicker = true">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>{{ displayDate }}</span>
        </button>
      </div>
    </div>

    <!-- 数字键盘区域 -->
    <div class="keypad-section">
      <div class="keypad-grid">
        <button class="keypad-btn" @click="onKeyInput('1')">1</button>
        <button class="keypad-btn" @click="onKeyInput('2')">2</button>
        <button class="keypad-btn" @click="onKeyInput('3')">3</button>
        <button class="keypad-btn operator" @click="onKeyInput('+')">+</button>
        <button class="keypad-btn" @click="onKeyInput('4')">4</button>
        <button class="keypad-btn" @click="onKeyInput('5')">5</button>
        <button class="keypad-btn" @click="onKeyInput('6')">6</button>
        <button class="keypad-btn operator" @click="onKeyInput('-')">-</button>
        <button class="keypad-btn" @click="onKeyInput('7')">7</button>
        <button class="keypad-btn" @click="onKeyInput('8')">8</button>
        <button class="keypad-btn" @click="onKeyInput('9')">9</button>
        <button class="keypad-btn operator" @click="onKeyDelete">
          <span class="material-symbols-outlined">backspace</span>
        </button>
        <button class="keypad-btn" @click="onKeyInput('.')">.</button>
        <button class="keypad-btn" @click="onKeyInput('0')">0</button>
        <button 
          class="keypad-btn save-btn" 
          :disabled="!amount || !selectedCategory"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </button>
      </div>
    </div>

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
.mobile-entry {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

/* 顶部导航 */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
}

.back-btn {
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

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.header-spacer {
  width: 32px;
}

/* 类型切换 */
.type-switch-wrapper {
  padding: 0 16px 12px;
}

.type-switch {
  display: flex;
  height: 40px;
  padding: 4px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.3s;
}

.type-option input {
  display: none;
}

.type-option.active {
  background: var(--color-primary);
  color: var(--color-background);
}

/* 金额显示 */
.amount-section {
  padding: 16px 16px 12px;
}

.amount-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--color-text-strong);
  margin: 0;
}

.currency-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.currency-btn .material-symbols-outlined {
  font-size: 18px;
}

.amount-display .value {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -2px;
}

.convert-hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.convert-hint .rate {
  font-size: 11px;
  opacity: 0.7;
}

/* 分类选择 */
.category-section {
  padding: 0 16px 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 1;
  padding: 12px 8px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:active {
  transform: scale(0.95);
}

.category-item.active {
  background: var(--color-primary-alpha-20);
  border-color: var(--color-primary);
}

.category-item .material-symbols-outlined {
  font-size: 24px;
  color: var(--color-text-muted);
}

.category-item.active .material-symbols-outlined {
  color: var(--color-primary);
}

.category-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-strong);
  text-align: center;
  line-height: 1.2;
}

/* 备注和快捷操作 */
.notes-section {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-strong);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.note-input:focus {
  border-color: var(--color-primary);
}

.note-input::placeholder {
  color: var(--color-text-muted);
}

.quick-actions {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 10px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.quick-btn .material-symbols-outlined {
  font-size: 16px;
}

/* 数字键盘区域 */
.keypad-section {
  margin-top: auto;
  padding: 12px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.keypad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-radius: 999px;
  background: var(--color-surface);
  border: none;
  color: var(--color-text-strong);
  font-size: 22px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.keypad-btn:active {
  background: var(--color-surface-hover);
}

.keypad-btn.operator {
  color: var(--color-primary);
  font-size: 24px;
}

.keypad-btn.operator .material-symbols-outlined {
  font-size: 22px;
}

.keypad-btn.save-btn {
  grid-column: span 2;
  background: var(--color-primary);
  color: var(--color-background);
  font-size: 15px;
  font-weight: 600;
}

.keypad-btn.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.keypad-btn.save-btn:not(:disabled):active {
  background: var(--color-primary-pressed);
}
</style>
