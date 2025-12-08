<script setup lang="ts">
/**
 * 单条交易记录组件
 * 支持滑动编辑/删除操作
 * 移动端专用 (Vant)
 */
import { computed } from 'vue'
import { SwipeCell as VanSwipeCell } from 'vant'
import 'vant/es/swipe-cell/style'
import { formatWithCurrency } from '@/hooks'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
  showEdit?: boolean
  showDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showEdit: true,
  showDelete: true
})

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

// 格式化金额（使用交易的原始币种）
const formattedAmount = computed(() => {
  const sign = props.transaction.type === 'income' ? '+' : '−' // Unicode 减号 U+2212
  const currency = props.transaction.currency || 'USD'
  return `${sign}${formatWithCurrency(props.transaction.amount, currency)}`
})

const handleEdit = () => {
  emit('edit', props.transaction)
}

const handleDelete = () => {
  emit('delete', props.transaction)
}
</script>

<template>
  <van-swipe-cell>
    <div class="transaction-card">
      <div class="tx-icon" :class="transaction.type">
        <span class="material-symbols-outlined">{{ transaction.categoryIcon || 'receipt_long' }}</span>
      </div>
      <div class="tx-info">
        <p class="tx-title">{{ transaction.category }}</p>
        <p class="tx-desc">{{ transaction.description || transaction.category }}</p>
      </div>
      <p class="tx-amount" :class="transaction.type">{{ formattedAmount }}</p>
    </div>
    <template #right>
      <div class="swipe-actions">
        <button v-if="showEdit" class="action-btn edit" @click="handleEdit">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button v-if="showDelete" class="action-btn delete" @click="handleDelete">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </template>
  </van-swipe-cell>
</template>

<style scoped>
.transaction-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.tx-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tx-icon .material-symbols-outlined {
  font-size: 24px;
}

.tx-icon.income {
  background: rgba(77, 230, 165, 0.1);
  color: var(--color-income);
}

.tx-icon.expense {
  background: rgba(239, 95, 154, 0.1);
  color: var(--color-expense);
}

.tx-info {
  flex: 1;
  min-width: 0;
}

.tx-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0 0 2px;
}

.tx-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-amount {
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
  margin: 0;
}

.tx-amount.income {
  color: var(--color-income);
}

.tx-amount.expense {
  color: var(--color-text-strong);
}

/* 滑动操作按钮 */
.swipe-actions {
  display: flex;
  height: 100%;
}

.action-btn {
  width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  cursor: pointer;
}

.action-btn .material-symbols-outlined {
  font-size: 22px;
}

.action-btn.edit {
  background: var(--color-primary);
}

.action-btn.delete {
  background: var(--color-expense);
}
</style>
