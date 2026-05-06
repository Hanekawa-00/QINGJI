<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Empty as VanEmpty,
  showConfirmDialog,
  showToast
} from 'vant'
import 'vant/es/empty/style'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

import YearMonthPicker from '@/components/common/YearMonthPicker.vue'
import { useUserStore } from '@/stores/user.store'
import { CalendarGrid } from '@/components/common'
import { TransactionItem } from '@/components/mobile'
import type { Transaction } from '@/types'

defineOptions({ name: 'MobileCalendar' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// 日历组件引用
const calendarRef = ref<InstanceType<typeof CalendarGrid> | null>(null)

// 返回上一页
const goBack = () => router.back()

// 年月选择器
const showYearMonthPicker = ref(false)
const selectedYear = computed(() => calendarRef.value?.selectedYear ?? new Date().getFullYear())
const selectedMonth = computed(() => (calendarRef.value?.selectedMonth ?? new Date().getMonth()) + 1)

const onMonthClick = () => {
  showYearMonthPicker.value = true
}

const onYearMonthConfirm = (year: number, month: number) => {
  calendarRef.value?.setYearMonth(year, month - 1)
}

// 选中日期的交易记录（按创建时间倒序）
const dayTransactions = computed(() => {
  const dayData = calendarRef.value?.selectedDayData
  if (!dayData) return []
  return [...dayData.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// 编辑交易
const handleEdit = (transaction: Transaction) => {
  router.push({ 
    name: 'MobileEntry', 
    query: { id: transaction.id, from: 'MobileCalendar' } 
  })
}

// 删除交易
const handleDelete = async (transaction: Transaction) => {
  try {
    await showConfirmDialog({
      title: t('common.confirm'),
      message: t('entry.deleteConfirm')
    })
    await userStore.deleteTransaction(transaction.id)
    showToast(t('common.deleted'))
  } catch {
    // 用户取消
  }
}

// 跳转到记账
const goToEntry = () => router.push({ name: 'MobileEntry', query: { from: 'MobileCalendar' } })
</script>

<template>
  <div class="mobile-calendar">
    <!-- 日历网格组件（包含返回按钮和月份导航） -->
    <div class="calendar-wrapper">
      <CalendarGrid ref="calendarRef" compact show-back @back="goBack" @month-click="onMonthClick">
        <!-- 月度统计插槽 -->
        <template #stats="{ stats, format }">
          <div class="month-stats-card">
            <div class="stat-item">
              <span class="stat-label">{{ t('reports.income') }}</span>
              <span class="stat-value income">{{ format(stats.income) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('reports.expense') }}</span>
              <span class="stat-value expense">{{ format(stats.expense) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('dashboard.currentBalance') }}</span>
              <span class="stat-value" :class="stats.balance >= 0 ? 'income' : 'expense'">
                {{ format(stats.balance) }}
              </span>
            </div>
          </div>
        </template>

        <!-- 选中日期详情插槽 -->
        <template #day-detail="{ day, display, format }">
          <div class="day-transactions">
            <div class="day-header">
              <h3 class="day-title">{{ display }}</h3>
              <div v-if="day" class="day-summary">
                <span v-if="day.income > 0" class="income">+{{ format(day.income) }}</span>
                <span v-if="day.expense > 0" class="expense">-{{ format(day.expense) }}</span>
              </div>
            </div>

            <template v-if="dayTransactions.length > 0">
              <div class="transaction-list">
                <TransactionItem
                  v-for="tx in dayTransactions"
                  :key="tx.id"
                  :transaction="tx"
                  @edit="handleEdit"
                  @delete="handleDelete"
                />
              </div>
            </template>

            <van-empty 
              v-else 
              :description="t('calendar.noTransactionsOnDay')"
              image="search"
            />
          </div>
        </template>
      </CalendarGrid>
    </div>

    <!-- 底部间距 -->
    <div class="bottom-spacer" />

    <!-- 浮动添加按钮 -->
    <button class="fab-button" @click="goToEntry">
      <span class="material-symbols-outlined">add</span>
    </button>
    
    <!-- 年月选择器 -->
    <YearMonthPicker
      v-model:show="showYearMonthPicker"
      :year="selectedYear"
      :month="selectedMonth"
      @confirm="onYearMonthConfirm"
    />
  </div>
</template>

<style scoped>
.mobile-calendar {
  min-height: 100%;
  background: var(--color-background);
  padding-bottom: calc(100px + var(--safe-area-inset-bottom, 0px));
}

/* 日历网格容器 */
.calendar-wrapper {
  padding: 0 16px;
}

/* 月度统计卡片 - 与首页保持一致 */
.month-stats-card {
  display: flex;
  justify-content: space-between;
  margin: 12px 0 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.stat-value.income {
  color: var(--color-income);
}

.stat-value.expense {
  color: var(--color-expense);
}

/* 选中日期的交易列表 */
.day-transactions {
  padding: 0;
  margin-top: 16px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.day-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.day-summary {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.day-summary .income {
  color: var(--color-income);
}

.day-summary .expense {
  color: var(--color-expense);
}

/* 交易列表 */
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 底部间距 */
.bottom-spacer {
  height: calc(80px + var(--safe-area-inset-bottom, 0px));
}

/* 浮动添加按钮 */
.fab-button {
  position: fixed;
  bottom: calc(24px + var(--safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
}

.fab-button .material-symbols-outlined {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-background);
}

/* 空状态 */
:deep(.van-empty) {
  padding: 40px 0;
}

:deep(.van-empty__description) {
  color: var(--color-text-muted);
}
</style>
