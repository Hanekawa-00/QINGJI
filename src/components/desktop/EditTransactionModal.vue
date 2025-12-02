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
  useMessage
} from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import type { Transaction, TransactionType } from '@/types'

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
const message = useMessage()

// 表单数据
const formData = ref({
  type: 'expense' as TransactionType,
  amount: 0,
  categoryId: '',
  description: '',
  date: Date.now()
})

// 监听 transaction 变化，填充表单
watch(() => props.transaction, (transaction) => {
  if (transaction) {
    formData.value.type = transaction.type
    formData.value.amount = transaction.amount
    formData.value.description = transaction.description
    formData.value.date = new Date(transaction.date).getTime()
    
    // 找到分类ID
    const category = userStore.categories.find(c => c.name === transaction.category)
    formData.value.categoryId = category?.id || ''
  }
}, { immediate: true })

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

      <!-- 金额 -->
      <n-form-item label="Amount">
        <n-input-number
          v-model:value="formData.amount"
          :min="0"
          :precision="2"
          placeholder="Enter amount"
          style="width: 100%"
        >
          <template #prefix>$</template>
        </n-input-number>
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
