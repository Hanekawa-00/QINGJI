<script setup lang="ts">
/**
 * 交易记录列表组件
 * 支持编辑/删除操作
 * 桌面端专用 (NaiveUI)
 */
import { NList, NEmpty } from 'naive-ui'
import TransactionItem from './TransactionItem.vue'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
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
  <n-list v-if="transactions.length > 0" :hoverable="hoverable" :clickable="clickable">
    <TransactionItem 
      v-for="transaction in transactions" 
      :key="transaction.id"
      :transaction="transaction"
      :clickable="clickable"
      :show-actions="showActions"
      @click="emit('itemClick', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </n-list>
  <n-empty v-else :description="emptyText">
    <template #icon>
      <span class="material-symbols-outlined empty-icon">{{ emptyIcon }}</span>
    </template>
  </n-empty>
</template>

<style scoped>
.empty-icon {
  font-size: 48px;
  color: var(--color-text-muted);
}
</style>
