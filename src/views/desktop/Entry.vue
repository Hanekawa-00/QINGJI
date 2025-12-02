<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  NCard, 
  NGrid, 
  NGi, 
  NButton, 
  NSpace,
  NInput,
  NRadioGroup,
  NRadioButton,
  NDatePicker,
  NModal,
  NForm,
  NFormItem,
  useMessage
} from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import type { TransactionType } from '@/types'

const userStore = useUserStore()
const message = useMessage()

// 交易类型
const transactionType = ref<TransactionType>('expense')

// 金额输入
const amountDisplay = ref('0')
const pendingOperator = ref<'+' | '-' | null>(null)
const storedValue = ref<number>(0)

// 添加新分类
const showAddCategory = ref(false)
const newCategory = ref({ name: '', icon: 'category' })
const categoryIcons = ['restaurant', 'local_cafe', 'shopping_bag', 'directions_car', 'home', 'sports_esports', 'movie', 'flight', 'fitness_center', 'pets', 'school', 'medical_services', 'attach_money', 'work', 'card_giftcard']

// 选中的分类
const selectedCategory = ref<string>('1') // 默认选择Food & Drink

// 描述
const description = ref('')

// 日期 (NDatePicker 使用时间戳)
const selectedDateTimestamp = ref<number>(Date.now())

// 格式化日期用于提交（使用本地时间避免时区问题）
const selectedDate = computed(() => {
  const date = new Date(selectedDateTimestamp.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})


// 格式化金额显示
const formattedAmount = computed(() => {
  const amount = parseFloat(amountDisplay.value) || 0
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
  
  // 显示待计算状态
  if (pendingOperator.value) {
    const storedFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(storedValue.value)
    return `${storedFormatted} ${pendingOperator.value} ${formatted}`
  }
  return formatted
})

// 分类列表（根据交易类型过滤）
const availableCategories = computed(() => {
  return userStore.categories.filter(c => c.type === transactionType.value)
})

// 数字键盘输入
const handleKeypad = (key: string) => {
  if (key === 'backspace') {
    if (amountDisplay.value.length > 1) {
      amountDisplay.value = amountDisplay.value.slice(0, -1)
    } else {
      amountDisplay.value = '0'
    }
  } else if (key === '.') {
    if (!amountDisplay.value.includes('.')) {
      amountDisplay.value += '.'
    }
  } else if (key === '+' || key === '-') {
    // 计算器功能
    if (pendingOperator.value && storedValue.value !== 0) {
      // 先计算之前的运算
      const current = parseFloat(amountDisplay.value) || 0
      if (pendingOperator.value === '+') {
        amountDisplay.value = String(storedValue.value + current)
      } else {
        amountDisplay.value = String(storedValue.value - current)
      }
    }
    storedValue.value = parseFloat(amountDisplay.value) || 0
    pendingOperator.value = key as '+' | '-'
    amountDisplay.value = '0'
  } else if (key === '=') {
    // 执行计算
    if (pendingOperator.value && storedValue.value !== 0) {
      const current = parseFloat(amountDisplay.value) || 0
      if (pendingOperator.value === '+') {
        amountDisplay.value = String(storedValue.value + current)
      } else {
        amountDisplay.value = String(Math.max(0, storedValue.value - current))
      }
      pendingOperator.value = null
      storedValue.value = 0
    }
  } else {
    // 数字输入
    if (amountDisplay.value === '0') {
      amountDisplay.value = key
    } else {
      amountDisplay.value += key
    }
  }
}

// 添加新分类
const handleAddCategory = () => {
  if (!newCategory.value.name.trim()) {
    message.warning('Please enter a category name')
    return
  }
  
  userStore.addCategory({
    name: newCategory.value.name,
    icon: newCategory.value.icon,
    type: transactionType.value
  })
  
  message.success('Category added!')
  showAddCategory.value = false
  newCategory.value = { name: '', icon: 'category' }
}

// 选择分类
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

// 重置表单
const resetForm = () => {
  transactionType.value = 'expense'
  amountDisplay.value = '0'
  pendingOperator.value = null
  storedValue.value = 0
  description.value = ''
  selectedDateTimestamp.value = Date.now()
  selectedCategory.value = '1'
}

// 保存交易
const saveTransaction = async () => {
  const amount = parseFloat(amountDisplay.value)
  if (amount <= 0) {
    message.warning('Please enter a valid amount')
    return
  }

  const category = userStore.categories.find(c => c.id === selectedCategory.value)
  if (!category) {
    message.warning('Please select a category')
    return
  }

  await userStore.addTransaction({
    type: transactionType.value,
    amount,
    category: category.name,
    categoryIcon: category.icon,
    description: description.value || `${category.name} transaction`,
    date: selectedDate.value
  })
  
  message.success('Transaction saved successfully!')
  resetForm()
}
</script>

<template>
  <div class="entry">
    <!-- Header -->
    <header class="entry-header">
      <div class="header-left">
        <h1 class="entry-title">New Entry</h1>
        <p class="entry-subtitle">Desktop form mirrors mobile flow.</p>
      </div>
    </header>

    <!-- Main Content -->
    <n-grid cols="1 m:3" :x-gap="24" :y-gap="16" responsive="screen" class="entry-content">
      <!-- Left Panel: Form -->
      <n-gi span="1 m:2">
        <n-card class="form-card" :bordered="true">
          <!-- Transaction Type & Amount -->
          <div class="type-amount-section">
            <n-radio-group v-model:value="transactionType" name="transaction-type">
              <n-radio-button value="expense">Expense</n-radio-button>
              <n-radio-button value="income">Income</n-radio-button>
            </n-radio-group>
            <div class="amount-display">
              <p class="amount-label">Amount</p>
              <p class="amount-value">{{ formattedAmount }}</p>
            </div>
          </div>

          <!-- Category Selection -->
          <div class="category-section">
            <p class="section-label">Category</p>
            <div class="category-grid">
              <div
                v-for="category in availableCategories"
                :key="category.id"
                :class="['category-item', { selected: selectedCategory === category.id }]"
                @click="selectCategory(category.id)"
              >
                <span class="material-symbols-outlined">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
              </div>
              <div class="category-item add-category" @click="showAddCategory = true">
                <span class="material-symbols-outlined">add_circle</span>
                <span class="category-name">Add New</span>
              </div>
            </div>
          </div>

          <!-- Description & Tags -->
          <div class="description-section">
            <n-input 
              v-model:value="description"
              placeholder="Add a brief description..." 
              size="large"
            />
            <n-space :size="8" class="tag-buttons">
              <n-date-picker
                v-model:value="selectedDateTimestamp"
                type="date"
                size="small"
                :actions="['now', 'confirm']"
              >
                <template #date-icon>
                  <span class="material-symbols-outlined" style="font-size: 16px;">calendar_today</span>
                </template>
              </n-date-picker>
              <!-- <n-button quaternary size="medium">
                <template #icon>
                  <span class="material-symbols-outlined">image</span>
                </template>
                Image
              </n-button> -->
            </n-space>
          </div>
        </n-card>
      </n-gi>

      <!-- Right Panel: Keypad -->
      <n-gi>
        <n-card class="keypad-card" :bordered="true">
          <template #header>
            <span class="keypad-label">Quick Keypad</span>
          </template>
          <div class="keypad-grid">
            <n-button class="keypad-btn" @click="handleKeypad('1')">1</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('2')">2</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('3')">3</n-button>
            <n-button class="keypad-btn operator" @click="handleKeypad('+')">+</n-button>
            
            <n-button class="keypad-btn" @click="handleKeypad('4')">4</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('5')">5</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('6')">6</n-button>
            <n-button class="keypad-btn operator" @click="handleKeypad('-')">-</n-button>
            
            <n-button class="keypad-btn" @click="handleKeypad('7')">7</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('8')">8</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('9')">9</n-button>
            <n-button class="keypad-btn operator" @click="handleKeypad('backspace')">
              <span class="material-symbols-outlined">backspace</span>
            </n-button>
            
            <n-button class="keypad-btn operator" @click="handleKeypad('=')">=</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('0')">0</n-button>
            <n-button class="keypad-btn" @click="handleKeypad('.')">.</n-button>
            <n-button type="primary" class="keypad-btn save-btn" @click="saveTransaction">Save</n-button>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Add Category Modal -->
    <n-modal v-model:show="showAddCategory" preset="card" title="Add New Category" style="width: 400px;">
      <n-form>
        <n-form-item label="Category Name">
          <n-input v-model:value="newCategory.name" placeholder="Enter category name" />
        </n-form-item>
        <n-form-item label="Icon">
          <div class="icon-picker">
            <div
              v-for="icon in categoryIcons"
              :key="icon"
              :class="['icon-option', { selected: newCategory.icon === icon }]"
              @click="newCategory.icon = icon"
            >
              <span class="material-symbols-outlined">{{ icon }}</span>
            </div>
          </div>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddCategory = false">Cancel</n-button>
          <n-button type="primary" @click="handleAddCategory">Add</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.entry {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.entry-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .entry-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.entry-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.entry-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.entry-content {
  margin-top: 8px;
}

/* 表单卡片 */
.form-card,
.keypad-card {
  background: var(--color-surface) !important;
  border-color: rgba(43, 215, 118, 0.2) !important;
}

/* 类型和金额 */
.type-amount-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.amount-display {
  text-align: right;
}

.amount-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.amount-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 4px 0 0 0;
}

/* 分类选择 */
.category-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin: 0 0 12px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (min-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  min-width: 80px;
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.category-item.selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.category-item.selected .material-symbols-outlined {
  color: var(--color-primary);
}

.category-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-strong);
}

/* 描述输入 */
.description-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-buttons {
  margin-top: 8px;
}

/* 键盘区域 */
.keypad-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.keypad-card {
  min-width: 280px;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.keypad-btn {
  width: 100% !important;
  aspect-ratio: 1 !important;
  height: unset !important;
  min-width: unset !important;
  max-width: unset !important;
  padding: 0 !important;
  font-size: clamp(16px, 4vw, 22px) !important;
  font-weight: 600 !important;
  border-radius: 50% !important;
  background: var(--color-surface) !important;
  border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent) !important;
  color: var(--color-text-strong) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.keypad-btn:hover {
  background: var(--color-surface-hover) !important;
}

.keypad-btn:active {
  background: var(--color-surface-active) !important;
}

.keypad-btn.operator {
  color: var(--color-primary) !important;
}

.keypad-btn.save-btn {
  grid-column: span 2;
  aspect-ratio: unset !important;
  height: 100% !important;
  border-radius: 9999px !important;
  background: var(--color-primary) !important;
  color: var(--color-background) !important;
  border-color: color-mix(in srgb, var(--color-primary) 70%, transparent) !important;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--color-primary) 35%, transparent);
  font-size: clamp(14px, 3vw, 18px) !important;
}

/* Icon Picker */
.icon-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: var(--color-primary);
}

.icon-option.selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
}

.icon-option .material-symbols-outlined {
  font-size: 24px;
}
</style>
