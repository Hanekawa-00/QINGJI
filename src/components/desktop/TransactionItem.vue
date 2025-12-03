<script setup lang="ts">
/**
 * 单条交易记录组件
 * 支持编辑/删除操作
 * 可跨平台复用（桌面端/移动端）
 */
import { h, computed } from 'vue'
import { NListItem, NThing, NDropdown, NButton, useDialog, useMessage } from 'naive-ui'
import { formatWithCurrency, getAmountColor } from '@/hooks'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
  clickable?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  showActions: true
})

const emit = defineEmits<{
  click: [transaction: Transaction]
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

const dialog = useDialog()
const message = useMessage()

// 格式化原始金额（使用交易记录的原始币种）
const formattedAmount = computed(() => {
  const currency = props.transaction.currency || 'USD'
  const formatted = formatWithCurrency(props.transaction.amount, currency)
  return props.transaction.type === 'income' ? `+${formatted}` : `-${formatted}`
})

// 下拉菜单选项
const dropdownOptions = [
  {
    label: 'Edit',
    key: 'edit',
    icon: () => h('span', { class: 'material-symbols-outlined', style: 'font-size: 18px' }, 'edit')
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: () => h('span', { class: 'material-symbols-outlined', style: 'font-size: 18px; color: var(--color-expense)' }, 'delete')
  }
]

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.transaction)
  }
}

const handleSelect = (key: string) => {
  if (key === 'edit') {
    emit('edit', props.transaction)
  } else if (key === 'delete') {
    dialog.warning({
      title: 'Delete Transaction',
      content: `Are you sure you want to delete "${props.transaction.description}"?`,
      positiveText: 'Delete',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        emit('delete', props.transaction)
        message.success('Transaction deleted')
      }
    })
  }
}
</script>

<template>
  <n-list-item @click="handleClick">
    <template #prefix>
      <div class="transaction-icon" :class="transaction.type">
        <span class="material-symbols-outlined">{{ transaction.categoryIcon }}</span>
      </div>
    </template>
    <n-thing 
      :title="transaction.description" 
      :description="transaction.category" 
    />
    <template #suffix>
      <div class="suffix-wrapper">
        <span 
          class="transaction-amount" 
          :style="{ color: getAmountColor(transaction.type) }"
        >
          {{ formattedAmount }}
        </span>
        <n-dropdown 
          v-if="showActions"
          trigger="click" 
          :options="dropdownOptions" 
          @select="handleSelect"
          placement="bottom-end"
        >
          <n-button quaternary circle size="small" class="action-btn" @click.stop>
            <template #icon>
              <span class="material-symbols-outlined">more_vert</span>
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </template>
  </n-list-item>
</template>

<style scoped>
.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.transaction-icon.income {
  background: rgba(77, 230, 165, 0.1);
  color: var(--color-income);
}

.transaction-icon.expense {
  background: rgba(239, 95, 154, 0.1);
  color: var(--color-expense);
}

.suffix-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transaction-amount {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.n-list-item:hover .action-btn {
  opacity: 1;
}

.action-btn .material-symbols-outlined {
  font-size: 18px;
  color: var(--color-text-muted);
}
</style>
