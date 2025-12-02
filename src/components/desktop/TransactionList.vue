<script setup lang="ts">
/**
 * 交易记录列表组件
 * 桌面端专用 (NaiveUI)
 */
import { NList, NEmpty } from 'naive-ui'
import TransactionItem from './TransactionItem.vue'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
  hoverable?: boolean
  clickable?: boolean
  emptyText?: string
  emptyIcon?: string
}

withDefaults(defineProps<Props>(), {
  hoverable: true,
  clickable: false,
  emptyText: 'No transactions',
  emptyIcon: 'receipt_long'
})

const emit = defineEmits<{
  itemClick: [transaction: Transaction]
}>()
</script>

<template>
  <n-list v-if="transactions.length > 0" :hoverable="hoverable" :clickable="clickable">
    <TransactionItem 
      v-for="transaction in transactions" 
      :key="transaction.id"
      :transaction="transaction"
      :clickable="clickable"
      @click="emit('itemClick', $event)"
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
