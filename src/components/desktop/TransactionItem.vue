<script setup lang="ts">
/**
 * 单条交易记录组件
 * 可跨平台复用（桌面端/移动端）
 */
import { NListItem, NThing } from 'naive-ui'
import { formatTransactionAmount, getAmountColor } from '@/hooks'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false
})

const emit = defineEmits<{
  click: [transaction: Transaction]
}>()

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.transaction)
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
      <span 
        class="transaction-amount" 
        :style="{ color: getAmountColor(transaction.type) }"
      >
        {{ formatTransactionAmount(transaction) }}
      </span>
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

.transaction-amount {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
