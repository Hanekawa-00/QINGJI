<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NCard, 
  NGrid, 
  NGi, 
  NButton, 
  NSpace,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadioButton,
  NDatePicker,
  NModal,
  NSelect,
  NTooltip,
  useMessage
} from 'naive-ui'
import { Calculator } from '@/components/common'
import { ALL_CATEGORY_ICONS } from '@/config/icons'
import { useUserStore, useCurrencyStore } from '@/stores'
import type { TransactionType, CurrencyCode } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()
const message = useMessage()

// 初始化币种 store
onMounted(() => {
  currencyStore.initialize()
})

// 交易类型
const transactionType = ref<TransactionType>('expense')

// 金额输入
const amount = ref(0)

// 分类管理
const showCategoryManager = ref(false)
const editingCategory = ref<{ id: string; name: string; icon: string } | null>(null)
const newCategory = ref({ name: '', icon: 'category' })
// 使用共享的图标配置
const categoryIcons = ALL_CATEGORY_ICONS

// 选中的分类（默认选择第一个可用分类）
const selectedCategory = ref<string>('')

// 描述
const description = ref('')

// 日期 (NDatePicker 使用时间戳)
const selectedDateTimestamp = ref<number>(Date.now())

// 选中的币种（默认使用主币种）
const selectedCurrency = ref<CurrencyCode>('USD')

// 手动汇率相关
const manualExchangeRate = ref<number>(1)
const isManualRate = ref(false)
const isLoadingRate = ref(false)

// 初始化时设置默认币种为主币种
watch(() => currencyStore.primaryCurrency, (newVal) => {
  if (newVal && selectedCurrency.value === 'USD') {
    selectedCurrency.value = newVal
  }
}, { immediate: true })

// 监听币种变化，自动获取汇率
watch(selectedCurrency, async (newCurrency) => {
  if (newCurrency === currencyStore.primaryCurrency) {
    manualExchangeRate.value = 1
    return
  }
  
  if (!isManualRate.value) {
    isLoadingRate.value = true
    try {
      const rate = currencyStore.getRate(newCurrency, currencyStore.primaryCurrency)
      manualExchangeRate.value = rate
    } finally {
      isLoadingRate.value = false
    }
  }
})

// 刷新汇率
const refreshExchangeRate = async () => {
  if (selectedCurrency.value === currencyStore.primaryCurrency) return
  
  isLoadingRate.value = true
  isManualRate.value = false
  try {
    await currencyStore.fetchExchangeRates()
    const rate = currencyStore.getRate(selectedCurrency.value, currencyStore.primaryCurrency)
    manualExchangeRate.value = rate
  } finally {
    isLoadingRate.value = false
  }
}

// 手动修改汇率时标记
const onRateChange = (value: number | null) => {
  if (value !== null) {
    manualExchangeRate.value = value
    isManualRate.value = true
  }
}

// 币种选项
const currencyOptions = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    label: `${c.flag} ${c.code}`,
    value: c.code
  }))
)

// 格式化日期用于提交（使用本地时间避免时区问题）
const selectedDate = computed(() => {
  const date = new Date(selectedDateTimestamp.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 计算转换后的金额（使用手动汇率）
const convertedAmountInfo = computed(() => {
  if (selectedCurrency.value === currencyStore.primaryCurrency) {
    return { convertedAmount: amount.value, rate: 1 }
  }
  return { 
    convertedAmount: amount.value * manualExchangeRate.value, 
    rate: manualExchangeRate.value 
  }
})

// 显示转换后的金额（如果币种不同）
const showConversion = computed(() => 
  selectedCurrency.value !== currencyStore.primaryCurrency && 
  amount.value > 0
)

const formattedConvertedAmount = computed(() => {
  return currencyStore.formatAmount(convertedAmountInfo.value.convertedAmount)
})

// 分类列表（根据交易类型过滤）
const availableCategories = computed(() => {
  return userStore.categories.filter(c => c.type === transactionType.value)
})

// 当交易类型变化或初始化时，自动选择第一个可用分类
watch([() => transactionType.value, () => availableCategories.value], () => {
  const firstCategory = availableCategories.value[0]
  if (firstCategory && !availableCategories.value.some(c => c.id === selectedCategory.value)) {
    selectedCategory.value = firstCategory.id
  }
}, { immediate: true })

// 当前币种符号
const currencySymbol = computed(() => {
  const info = currencyStore.getCurrencyInfo(selectedCurrency.value)
  return info?.symbol || '¥'
})

// ==================== 分类管理 ====================

// 添加新分类
const handleAddCategory = async () => {
  if (!newCategory.value.name.trim()) {
    message.warning(t('messages.enterCategoryName'))
    return
  }
  
  await userStore.addCategory({
    name: newCategory.value.name,
    icon: newCategory.value.icon,
    type: transactionType.value
  })
  
  message.success(t('messages.categoryAdded'))
  newCategory.value = { name: '', icon: 'category' }
}

// 开始编辑分类
const startEditCategory = (category: { id: string; name: string; icon: string }) => {
  editingCategory.value = { ...category }
}

// 保存编辑分类
const handleUpdateCategory = async () => {
  if (!editingCategory.value) return
  
  if (!editingCategory.value.name.trim()) {
    message.warning(t('messages.categoryNameEmpty'))
    return
  }
  
  await userStore.updateCategory(editingCategory.value.id, {
    name: editingCategory.value.name,
    icon: editingCategory.value.icon
  })
  
  message.success(t('messages.categoryUpdated'))
  editingCategory.value = null
}

// 取消编辑
const cancelEditCategory = () => {
  editingCategory.value = null
}

// 删除分类
const handleDeleteCategory = async (categoryId: string) => {
  const success = await userStore.deleteCategory(categoryId)
  
  if (success) {
    message.success(t('messages.categoryDeleted'))
    // 如果删除的是当前选中的分类，重置选择
    if (selectedCategory.value === categoryId) {
      const firstCategory = availableCategories.value[0]
      selectedCategory.value = firstCategory?.id || ''
    }
  } else {
    message.error(t('messages.cannotDeleteCategory'))
  }
}

// 选择分类
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

// 重置表单
const resetForm = () => {
  transactionType.value = 'expense'
  amount.value = 0
  description.value = ''
  selectedDateTimestamp.value = Date.now()
  // 分类会由 watch 自动设置为第一个可用分类
  selectedCategory.value = ''
  // 重置币种为主币种
  selectedCurrency.value = currencyStore.primaryCurrency
  // 重置汇率状态
  isManualRate.value = false
  manualExchangeRate.value = 1
}

// 保存交易（由计算器触发）
const handleSaveTransaction = async (value: number) => {
  if (value <= 0) {
    message.warning('Please enter a valid amount')
    return
  }
  
  amount.value = value

  const category = userStore.categories.find(c => c.id === selectedCategory.value)
  if (!category) {
    message.warning('Please select a category')
    return
  }

  // 获取转换后的金额和汇率
  const { convertedAmount, rate } = convertedAmountInfo.value

  await userStore.addTransaction({
    type: transactionType.value,
    amount: value,
    currency: selectedCurrency.value,
    convertedAmount,
    exchangeRate: rate,
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
        <h1 class="entry-title">{{ t('entry.title') }}</h1>
        <p class="entry-subtitle">{{ t('entry.subtitle') }}</p>
      </div>
    </header>

    <!-- Main Content -->
    <n-grid cols="1 m:3" :x-gap="24" :y-gap="16" responsive="screen" class="entry-content">
      <!-- Left Panel: Form -->
      <n-gi span="1 m:2">
        <n-card class="form-card" :bordered="true">
          <!-- Transaction Type & Currency -->
          <div class="type-currency-section">
            <n-radio-group v-model:value="transactionType" name="transaction-type">
              <n-radio-button value="expense">{{ t('entry.expense') }}</n-radio-button>
              <n-radio-button value="income">{{ t('entry.income') }}</n-radio-button>
            </n-radio-group>
            <n-select
              v-model:value="selectedCurrency"
              :options="currencyOptions"
              style="width: 120px"
              size="small"
            />
          </div>

          <!-- 汇率编辑（如果币种不同） -->
          <div v-if="showConversion" class="conversion-section">
            <p class="converted-amount">
              ≈ {{ formattedConvertedAmount }}
              <span v-if="isManualRate" class="manual-badge">Manual</span>
            </p>
            <div class="exchange-rate-editor">
              <span class="rate-label">1 {{ selectedCurrency }} =</span>
              <n-input-number
                :value="manualExchangeRate"
                :min="0.0001"
                :precision="6"
                :step="0.01"
                size="small"
                style="width: 120px"
                @update:value="onRateChange"
              />
              <span class="rate-label">{{ currencyStore.primaryCurrency }}</span>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button 
                    :loading="isLoadingRate" 
                    @click="refreshExchangeRate"
                    quaternary
                    circle
                    size="small"
                  >
                    <span class="material-symbols-outlined" style="font-size: 16px;">refresh</span>
                  </n-button>
                </template>
                Fetch latest rate
              </n-tooltip>
            </div>
          </div>

          <!-- Category Selection -->
          <div class="category-section">
            <p class="section-label">{{ t('entry.category') }}</p>
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
              <div class="category-item add-category" @click="showCategoryManager = true">
                <span class="material-symbols-outlined">settings</span>
                <span class="category-name">{{ t('entry.manageCategories') }}</span>
              </div>
            </div>
          </div>

          <!-- Description & Tags -->
          <div class="description-section">
            <n-input 
              v-model:value="description"
              :placeholder="t('entry.descriptionPlaceholder')" 
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

      <!-- Right Panel: Calculator -->
      <n-gi>
        <Calculator 
          v-model="amount"
          :currency-symbol="currencySymbol"
          :save-button-text="t('entry.save')"
          @save="handleSaveTransaction"
        />
      </n-gi>
    </n-grid>

    <!-- Category Manager Modal -->
    <n-modal v-model:show="showCategoryManager" preset="card" :title="t('entry.manageCategories')" style="width: 500px;">
      <!-- 现有分类列表 -->
      <div class="category-manager">
        <p class="manager-subtitle">{{ transactionType === 'expense' ? t('entry.expense') : t('entry.income') }} {{ t('entry.category') }}</p>
        
        <div class="category-list">
          <div 
            v-for="category in availableCategories" 
            :key="category.id"
            class="category-list-item"
          >
            <!-- 编辑模式 -->
            <template v-if="editingCategory?.id === category.id">
              <div class="edit-form">
                <n-input 
                  v-model:value="editingCategory.name" 
                  :placeholder="t('entry.categoryName')"
                  size="small"
                  style="flex: 1"
                />
                <n-select
                  v-model:value="editingCategory.icon"
                  :options="categoryIcons.map(i => ({ label: i, value: i }))"
                  size="small"
                  style="width: 120px"
                  :render-label="(option: any) => h('span', { class: 'material-symbols-outlined', style: 'font-size: 18px' }, option.label)"
                />
                <n-button size="small" type="primary" @click="handleUpdateCategory">
                  <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
                </n-button>
                <n-button size="small" @click="cancelEditCategory">
                  <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
                </n-button>
              </div>
            </template>
            
            <!-- 显示模式 -->
            <template v-else>
              <div class="category-info">
                <span class="material-symbols-outlined">{{ category.icon }}</span>
                <span class="category-label">{{ category.name }}</span>
              </div>
              <div class="category-actions">
                <n-button quaternary size="small" @click="startEditCategory(category)">
                  <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                </n-button>
                <n-button quaternary size="small" @click="handleDeleteCategory(category.id)">
                  <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-expense);">delete</span>
                </n-button>
              </div>
            </template>
          </div>
          
          <!-- 空状态 -->
          <div v-if="availableCategories.length === 0" class="empty-categories">
            {{ t('common.noData') }}
          </div>
        </div>
        
        <!-- 添加新分类 -->
        <div class="add-category-section">
          <p class="manager-subtitle">{{ t('entry.addCategory') }}</p>
          <div class="add-category-form">
            <n-input 
              v-model:value="newCategory.name" 
              :placeholder="t('entry.categoryName')" 
              size="small"
              style="flex: 1"
            />
            <n-select
              v-model:value="newCategory.icon"
              :options="categoryIcons.map(i => ({ label: i, value: i }))"
              size="small"
              style="width: 120px"
              :render-label="(option: any) => h('span', { class: 'material-symbols-outlined', style: 'font-size: 18px' }, option.label)"
            />
            <n-button type="primary" size="small" @click="handleAddCategory">
              <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
            </n-button>
          </div>
        </div>
      </div>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCategoryManager = false">{{ t('common.done') }}</n-button>
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
.form-card {
  background: var(--color-surface) !important;
  border-color: rgba(43, 215, 118, 0.2) !important;
}

/* 类型和币种选择 */
.type-currency-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

/* 汇率转换 */
.conversion-section {
  padding: 12px;
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.converted-amount {
  font-size: 0.875rem;
  color: var(--color-primary);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.manual-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  color: var(--color-primary);
  border-radius: 4px;
}

.exchange-rate-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rate-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
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

/* Category Manager */
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.manager-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.category-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-info .material-symbols-outlined {
  font-size: 20px;
  color: var(--color-primary);
}

.category-label {
  font-weight: 500;
  color: var(--color-text-strong);
}

.category-actions {
  display: flex;
  gap: 4px;
}

.edit-form {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.empty-categories {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
}

.add-category-section {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.add-category-form {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
