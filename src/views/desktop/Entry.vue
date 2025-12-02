<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'
import type { TransactionType } from '@/types'

const userStore = useUserStore()

// 交易类型
const transactionType = ref<TransactionType>('expense')

// 金额输入
const amountDisplay = ref('0')

// 选中的分类
const selectedCategory = ref<string>('1') // 默认选择Food & Drink

// 描述
const description = ref('')

// 日期
const selectedDate = ref(new Date().toISOString().split('T')[0])

// 格式化金额显示
const formattedAmount = computed(() => {
  const amount = parseFloat(amountDisplay.value) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
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
    // 计算器功能（简化版本）
    // 这里可以扩展实现完整的计算器功能
  } else {
    // 数字输入
    if (amountDisplay.value === '0') {
      amountDisplay.value = key
    } else {
      amountDisplay.value += key
    }
  }
}

// 切换交易类型
const switchTransactionType = (type: TransactionType) => {
  transactionType.value = type
  // 切换类型后自动选择第一个可用分类
  const firstCategory = availableCategories.value[0]
  if (firstCategory) {
    selectedCategory.value = firstCategory.id
  }
}

// 选择分类
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

// 保存交易
const saveTransaction = () => {
  const amount = parseFloat(amountDisplay.value)
  if (amount <= 0) {
    alert('Please enter a valid amount')
    return
  }

  const category = userStore.categories.find(c => c.id === selectedCategory.value)
  if (!category) {
    alert('Please select a category')
    return
  }

  userStore.addTransaction({
    type: transactionType.value,
    amount,
    category: category.name,
    categoryIcon: category.icon,
    description: description.value || `${category.name} transaction`,
    date: selectedDate.value
  })

  // 重置表单
  amountDisplay.value = '0'
  description.value = ''
  selectedDate.value = new Date().toISOString().split('T')[0]
  
  alert('Transaction saved successfully!')
}

// 获取选中分类信息
const selectedCategoryInfo = computed(() => {
  return userStore.categories.find(c => c.id === selectedCategory.value)
})
</script>

<template>
  <div class="entry">
    <!-- Header -->
    <header class="entry-header">
      <div class="header-left">
        <h1 class="entry-title">New Entry</h1>
        <p class="entry-subtitle">Desktop form mirrors mobile flow.</p>
      </div>
      <div class="header-right">
        <button class="date-button">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>Today</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <section class="entry-content">
      <!-- Left Panel: Form -->
      <div class="form-panel">
        <!-- Transaction Type & Amount -->
        <div class="type-amount-section">
          <div class="type-toggle">
            <label 
              :class="['type-option', { active: transactionType === 'expense' }]"
              @click="switchTransactionType('expense')"
            >
              <span>Expense</span>
              <input 
                type="radio" 
                name="transaction-type" 
                value="expense"
                v-model="transactionType"
              />
            </label>
            <label 
              :class="['type-option', { active: transactionType === 'income' }]"
              @click="switchTransactionType('income')"
            >
              <span>Income</span>
              <input 
                type="radio" 
                name="transaction-type" 
                value="income"
                v-model="transactionType"
              />
            </label>
          </div>
          <div class="amount-display">
            <p class="amount-label">Amount</p>
            <p class="amount-value">{{ formattedAmount }}</p>
          </div>
        </div>

        <!-- Category Selection -->
        <div class="category-section">
          <p class="section-label">Category</p>
          <div class="category-grid">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              :class="['category-item', { selected: selectedCategory === category.id }]"
              @click="selectCategory(category.id)"
            >
              <span class="material-symbols-outlined">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </button>
            <button class="category-item add-category">
              <span class="material-symbols-outlined">add_circle</span>
              <span class="category-name">Add New</span>
            </button>
          </div>
        </div>

        <!-- Description & Tags -->
        <div class="description-section">
          <input 
            v-model="description"
            class="description-input" 
            placeholder="Add a brief description..." 
          />
          <div class="tag-buttons">
            <button class="tag-btn">
              <span class="material-symbols-outlined">calendar_today</span>
              <span>Today</span>
            </button>
            <button class="tag-btn">
              <span class="material-symbols-outlined">image</span>
              <span>Image</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Keypad -->
      <div class="keypad-panel">
        <p class="keypad-label">Quick Keypad</p>
        <div class="keypad-grid">
          <button class="keypad-btn" @click="handleKeypad('1')">1</button>
          <button class="keypad-btn" @click="handleKeypad('2')">2</button>
          <button class="keypad-btn" @click="handleKeypad('3')">3</button>
          <button class="keypad-btn operator" @click="handleKeypad('+')">+</button>
          
          <button class="keypad-btn" @click="handleKeypad('4')">4</button>
          <button class="keypad-btn" @click="handleKeypad('5')">5</button>
          <button class="keypad-btn" @click="handleKeypad('6')">6</button>
          <button class="keypad-btn operator" @click="handleKeypad('-')">-</button>
          
          <button class="keypad-btn" @click="handleKeypad('7')">7</button>
          <button class="keypad-btn" @click="handleKeypad('8')">8</button>
          <button class="keypad-btn" @click="handleKeypad('9')">9</button>
          <button class="keypad-btn operator" @click="handleKeypad('backspace')">
            <span class="material-symbols-outlined">backspace</span>
          </button>
          
          <button class="keypad-btn" @click="handleKeypad('.')">.</button>
          <button class="keypad-btn" @click="handleKeypad('0')">0</button>
          <button class="keypad-btn save-btn" @click="saveTransaction">Save</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped src="@/styles/views/desktop-entry.css"></style>
