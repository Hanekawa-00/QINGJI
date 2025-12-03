<script setup lang="ts">
/**
 * 编辑交易记录弹窗组件
 */
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadioButton,
  NDatePicker,
  NButton,
  NSpace,
  NScrollbar,
  NSelect,
  NTooltip,
  useMessage
} from 'naive-ui'
import { useUserStore, useCurrencyStore } from '@/stores'
import type { Transaction, TransactionType, CurrencyCode } from '@/types'

interface Props {
  show: boolean
  transaction: Transaction | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'saved': [transaction: Transaction]
}>()

const userStore = useUserStore()
const currencyStore = useCurrencyStore()
const message = useMessage()

// 表单数据
const formData = ref({
  type: 'expense' as TransactionType,
  amount: 0,
  currency: 'USD' as CurrencyCode,
  exchangeRate: 1,
  categoryId: '',
  description: '',
  date: Date.now()
})

// 是否手动编辑汇率
const isManualRate = ref(false)
// 是否正在加载汇率
const isLoadingRate = ref(false)

// 币种选项
const currencyOptions = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    label: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code
  }))
)

// 当前币种信息
const currentCurrencyInfo = computed(() => 
  currencyStore.getCurrencyInfo(formData.value.currency)
)

// 计算转换后的金额
const convertedAmount = computed(() => {
  if (formData.value.currency === currencyStore.primaryCurrency) {
    return formData.value.amount
  }
  return formData.value.amount * formData.value.exchangeRate
})

// 监听 transaction 变化，填充表单
watch(() => props.transaction, (transaction) => {
  if (transaction) {
    formData.value.type = transaction.type
    formData.value.amount = transaction.amount
    formData.value.currency = transaction.currency || 'USD'
    formData.value.exchangeRate = transaction.exchangeRate || 1
    formData.value.description = transaction.description
    formData.value.date = new Date(transaction.date).getTime()
    isManualRate.value = false
    
    // 找到分类ID
    const category = userStore.categories.find(c => c.name === transaction.category)
    formData.value.categoryId = category?.id || ''
  }
}, { immediate: true })

// 监听币种变化，自动获取汇率
watch(() => formData.value.currency, async (newCurrency) => {
  if (newCurrency === currencyStore.primaryCurrency) {
    formData.value.exchangeRate = 1
    return
  }
  
  if (!isManualRate.value) {
    isLoadingRate.value = true
    try {
      const rate = currencyStore.getRate(newCurrency, currencyStore.primaryCurrency)
      formData.value.exchangeRate = rate
    } finally {
      isLoadingRate.value = false
    }
  }
})

// 刷新汇率（从 API 获取最新）
const refreshRate = async () => {
  if (formData.value.currency === currencyStore.primaryCurrency) return
  
  isLoadingRate.value = true
  isManualRate.value = false
  try {
    await currencyStore.fetchExchangeRates()
    const rate = currencyStore.getRate(formData.value.currency, currencyStore.primaryCurrency)
    formData.value.exchangeRate = rate
    message.success('Exchange rate updated')
  } catch {
    message.error('Failed to fetch exchange rate')
  } finally {
    isLoadingRate.value = false
  }
}

// 手动修改汇率时标记
const onRateChange = () => {
  isManualRate.value = true
}

// 可用分类（根据类型过滤）
const availableCategories = computed(() => {
  return userStore.categories.filter(c => c.type === formData.value.type)
})

// 选中的分类
const selectedCategory = computed(() => {
  return userStore.categories.find(c => c.id === formData.value.categoryId)
})

// 格式化日期
const formattedDate = computed(() => {
  const date = new Date(formData.value.date)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 关闭弹窗
const handleClose = () => {
  emit('update:show', false)
}

// 保存
const handleSave = async () => {
  if (formData.value.amount <= 0) {
    message.warning('Please enter a valid amount')
    return
  }

  if (!selectedCategory.value) {
    message.warning('Please select a category')
    return
  }

  if (!props.transaction) return

  const updates = {
    type: formData.value.type,
    amount: formData.value.amount,
    currency: formData.value.currency,
    convertedAmount: convertedAmount.value,
    exchangeRate: formData.value.exchangeRate,
    category: selectedCategory.value.name,
    categoryIcon: selectedCategory.value.icon,
    description: formData.value.description || `${selectedCategory.value.name} transaction`,
    date: formattedDate.value
  }

  await userStore.updateTransaction(props.transaction.id, updates)
  message.success('Transaction updated!')
  
  emit('saved', { ...props.transaction, ...updates })
  handleClose()
}

// 选择分类
const selectCategory = (categoryId: string) => {
  formData.value.categoryId = categoryId
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="card"
    title="Edit Transaction"
    :style="{ width: '480px', maxWidth: '90vw' }"
    :mask-closable="true"
    :close-on-esc="true"
  >
    <n-form v-if="transaction" label-placement="top">
      <!-- 交易类型 -->
      <n-form-item label="Type">
        <n-radio-group v-model:value="formData.type">
          <n-radio-button value="expense">Expense</n-radio-button>
          <n-radio-button value="income">Income</n-radio-button>
        </n-radio-group>
      </n-form-item>

      <!-- 金额和币种 -->
      <n-form-item label="Amount">
        <div class="amount-currency-row">
          <n-input-number
            v-model:value="formData.amount"
            :min="0"
            :precision="2"
            placeholder="Enter amount"
            style="flex: 1"
          >
            <template #prefix>{{ currentCurrencyInfo?.symbol || '$' }}</template>
          </n-input-number>
          <n-select
            v-model:value="formData.currency"
            :options="currencyOptions"
            style="width: 180px"
            size="medium"
          />
        </div>
      </n-form-item>

      <!-- 汇率（币种不同时显示） -->
      <n-form-item v-if="formData.currency !== currencyStore.primaryCurrency" label="Exchange Rate">
        <div class="exchange-rate-row">
          <n-input-number
            v-model:value="formData.exchangeRate"
            :min="0.0001"
            :precision="6"
            :step="0.01"
            style="flex: 1"
            @update:value="onRateChange"
          >
            <template #prefix>1 {{ formData.currency }} =</template>
            <template #suffix>{{ currencyStore.primaryCurrency }}</template>
          </n-input-number>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button 
                :loading="isLoadingRate" 
                @click="refreshRate"
                quaternary
                circle
              >
                <span class="material-symbols-outlined">refresh</span>
              </n-button>
            </template>
            Fetch latest rate
          </n-tooltip>
        </div>
        <div class="converted-preview">
          ≈ {{ currencyStore.formatAmount(convertedAmount) }}
          <span v-if="isManualRate" class="manual-badge">Manual</span>
        </div>
      </n-form-item>

      <!-- 分类 -->
      <n-form-item label="Category">
        <n-scrollbar style="max-height: 200px">
          <div class="category-grid">
            <div
              v-for="category in availableCategories"
              :key="category.id"
              :class="['category-item', { selected: formData.categoryId === category.id }]"
              @click="selectCategory(category.id)"
            >
              <span class="material-symbols-outlined">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </div>
          </div>
        </n-scrollbar>
      </n-form-item>

      <!-- 描述 -->
      <n-form-item label="Description">
        <n-input
          v-model:value="formData.description"
          placeholder="Enter description"
        />
      </n-form-item>

      <!-- 日期 -->
      <n-form-item label="Date">
        <n-date-picker
          v-model:value="formData.date"
          type="date"
          style="width: 100%"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">Cancel</n-button>
        <n-button type="primary" @click="handleSave">Save Changes</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.amount-currency-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.exchange-rate-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.converted-preview {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.manual-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  color: var(--color-primary);
  border-radius: 4px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
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
}

.category-item.selected .material-symbols-outlined {
  color: var(--color-primary);
}

.category-item .material-symbols-outlined {
  font-size: 24px;
}

.category-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-strong);
  text-align: center;
  line-height: 1.2;
}
</style>
