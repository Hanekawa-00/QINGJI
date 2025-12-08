<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  NCard, 
  NButton, 
  NSpace
} from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import { CalendarGrid } from '@/components/common'
import { TransactionList, EditTransactionModal } from '@/components/desktop'
import type { Transaction } from '@/types'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// 日历组件引用
const calendarRef = ref<InstanceType<typeof CalendarGrid> | null>(null)

// 编辑弹窗状态
const showEditModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

// 从日历组件获取选中日期的交易
const selectedDayTransactions = computed(() => {
  return calendarRef.value?.selectedDayData?.transactions || []
})

// 导航到新建条目
const navigateToEntry = () => {
  router.push('/desktop/entry')
}

// 编辑交易记录
const handleEdit = (transaction: Transaction) => {
  editingTransaction.value = transaction
  showEditModal.value = true
}

// 删除交易记录
const handleDelete = async (transaction: Transaction) => {
  await userStore.deleteTransaction(transaction.id)
}
</script>

<template>
  <div class="calendar">
    <!-- Header -->
    <header class="calendar-header">
      <div class="header-left">
        <h1 class="calendar-title">{{ t('calendar.title') }}</h1>
      </div>
      <n-button type="primary" circle @click="navigateToEntry">
        <template #icon>
          <span class="material-symbols-outlined">add</span>
        </template>
      </n-button>
    </header>

    <!-- Main Content -->
    <div class="calendar-layout">
      <!-- Calendar Grid -->
      <div class="calendar-left">
        <n-card class="calendar-grid-card" :bordered="true">
          <CalendarGrid ref="calendarRef">
            <!-- 月度统计通过插槽显示在右侧面板 -->
          </CalendarGrid>
        </n-card>
      </div>

      <!-- Right Panel: Stats & Transactions -->
      <div class="calendar-right">
        <n-space vertical :size="16">
          <!-- Month Statistics -->
          <n-card class="month-stats-card" :bordered="true">
            <div class="stats-row">
              <div class="stat-item">
                <p class="stat-label">{{ t('calendar.income') }}</p>
                <p class="stat-value income">{{ calendarRef?.formatCurrency(calendarRef?.monthStats?.income || 0) }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">{{ t('calendar.expense') }}</p>
                <p class="stat-value expense">{{ calendarRef?.formatCurrency(calendarRef?.monthStats?.expense || 0) }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">{{ t('reports.balance') }}</p>
                <p class="stat-value">{{ calendarRef?.formatCurrency(calendarRef?.monthStats?.balance || 0) }}</p>
              </div>
            </div>
          </n-card>

          <!-- Selected Day Transactions -->
          <n-card class="day-transactions-card" :bordered="true">
            <template #header>
              <div class="card-header">
                <h2 class="day-title">{{ calendarRef?.selectedDateDisplay || '' }}</h2>
                <div class="day-summary">
                  <span>{{ t('calendar.income') }}: {{ calendarRef?.formatCurrency(calendarRef?.selectedDayData?.income || 0) }}</span>
                  <span>{{ t('calendar.expense') }}: {{ calendarRef?.formatCurrency(calendarRef?.selectedDayData?.expense || 0) }}</span>
                </div>
              </div>
            </template>

            <TransactionList 
              :transactions="selectedDayTransactions"
              hoverable
              :empty-text="t('calendar.noTransactions')"
              empty-icon="event_busy"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </n-card>
        </n-space>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <EditTransactionModal
      v-model:show="showEditModal"
      :transaction="editingTransaction"
    />
  </div>
</template>

<!-- 样式已提取到 @/styles/views/calendar.css -->
