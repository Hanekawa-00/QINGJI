<script setup lang="ts">
/**
 * 按日期分组的交易记录列表组件
 * 支持编辑/删除操作
 * 可跨平台复用（桌面端/移动端）
 */
import { NList, NEmpty } from 'naive-ui'
import TransactionItem from './TransactionItem.vue'
import { formatCurrency } from '@/hooks'
import type { Transaction } from '@/types'
import type { GroupedTransactions } from '@/hooks'

interface Props {
  groups: GroupedTransactions[]
  hoverable?: boolean
  clickable?: boolean
  showActions?: boolean
  emptyText?: string
  emptyIcon?: string
}

withDefaults(defineProps<Props>(), {
  hoverable: true,
  clickable: false,
  showActions: true,
  emptyText: 'No transactions',
  emptyIcon: 'receipt_long'
})

const emit = defineEmits<{
  itemClick: [transaction: Transaction]
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()
</script>

<template>
  <div v-if="groups.length > 0" class="grouped-transactions">
    <template v-for="group in groups" :key="group.date">
      <!-- 日期分隔 -->
      <div class="date-separator">
        <span class="date-label">{{ group.dateDisplay }}</span>
        <span class="date-summary">
          <span v-if="group.dayIncome > 0" class="day-income">+{{ formatCurrency(group.dayIncome) }}</span>
          <span v-if="group.dayExpense > 0" class="day-expense">-{{ formatCurrency(group.dayExpense) }}</span>
        </span>
      </div>
      <!-- 该日交易列表 -->
      <n-list :hoverable="hoverable" :clickable="clickable">
        <TransactionItem 
          v-for="transaction in group.transactions" 
          :key="transaction.id"
          :transaction="transaction"
          :clickable="clickable"
          :show-actions="showActions"
          @click="emit('itemClick', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </n-list>
    </template>
  </div>
  <n-empty v-else :description="emptyText">
    <template #icon>
      <span class="material-symbols-outlined empty-icon">{{ emptyIcon }}</span>
    </template>
  </n-empty>
</template>

<style scoped>
.grouped-transactions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 日期分隔 */
.date-separator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 8px;
  border-bottom: 1px solid var(--color-border);
  margin-top: 8px;
}

.date-separator:first-child {
  margin-top: 0;
}

.date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.date-summary {
  display: flex;
  gap: 12px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.day-income {
  color: var(--color-income);
}

.day-expense {
  color: var(--color-expense);
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-muted);
}
</style>
