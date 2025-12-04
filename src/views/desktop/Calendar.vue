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
import { useCurrencyFormat } from '@/hooks'
import { TransactionList, MonthYearPicker, EditTransactionModal } from '@/components/desktop'
import type { CalendarDay, MonthCalendar, Transaction } from '@/types'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 编辑弹窗状态
const showEditModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

// 当前选择的年月
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth())
const selectedDate = ref(currentDate.toISOString().split('T')[0])

// 月份选择器时间戳
const monthPickerTimestamp = computed({
  get: () => new Date(selectedYear.value, selectedMonth.value, 1).getTime(),
  set: (val: number) => {
    const date = new Date(val)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth()
  }
})

// 星期标签
const weekDays = computed(() => [
  t('chart.sun'), t('chart.mon'), t('chart.tue'), t('chart.wed'), 
  t('chart.thu'), t('chart.fri'), t('chart.sat')
])

// 格式化日期显示
const monthYearDisplay = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' })
})

// 生成日历数据
const calendarData = computed<MonthCalendar>(() => {
  const year = selectedYear.value
  const month = selectedMonth.value
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取第一天是星期几（0-6）
  const firstDayOfWeek = firstDay.getDay()
  
  // 生成日历数组（6周 * 7天 = 42天）
  const days: CalendarDay[] = []
  const today = new Date().toISOString().split('T')[0]
  
  // 填充上月的日期
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      income: 0,
      expense: 0,
      transactions: []
    })
  }
  
  // 填充当月的日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // 获取该日的交易（使用 convertedAmount 用于统计）
    const dayTransactions = userStore.transactions.filter(t => t.date === dateStr)
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.convertedAmount ?? t.amount), 0)
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.convertedAmount ?? t.amount), 0)
    
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate.value,
      income,
      expense,
      transactions: dayTransactions
    })
  }
  
  // 填充下月的日期
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      income: 0,
      expense: 0,
      transactions: []
    })
  }
  
  // 计算本月统计
  const currentMonthDays = days.filter(d => d.isCurrentMonth)
  const totalIncome = currentMonthDays.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = currentMonthDays.reduce((sum, d) => sum + d.expense, 0)
  
  return {
    year,
    month,
    days,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  }
})

// 选中日期的数据
const selectedDayData = computed(() => {
  return calendarData.value.days.find(d => d.date === selectedDate.value)
})

// 选中日期的显示文本
const selectedDateDisplay = computed(() => {
  if (!selectedDayData.value) return ''
  const date = new Date(selectedDate.value)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${dayNames[date.getDay()]}`
})

// 点击日期
const selectDate = (day: CalendarDay) => {
  if (day.isCurrentMonth) {
    selectedDate.value = day.date
  }
}

// 上一月
const goToPreviousMonth = () => {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

// 下一月
const goToNextMonth = () => {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}


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
      <n-space align="center">
<MonthYearPicker v-model:value="monthPickerTimestamp" />
        <n-button type="primary" circle @click="navigateToEntry">
          <template #icon>
            <span class="material-symbols-outlined">add</span>
          </template>
        </n-button>
      </n-space>
    </header>

    <!-- Main Content -->
    <div class="calendar-layout">
      <!-- Calendar Grid -->
      <div class="calendar-left">
        <n-card class="calendar-grid-card" :bordered="true">
          <!-- Month Navigation -->
          <div class="month-navigation">
            <n-button text @click="goToPreviousMonth">
              <span class="material-symbols-outlined">chevron_left</span>
            </n-button>
            <h2 class="current-month">{{ monthYearDisplay }}</h2>
            <n-button text @click="goToNextMonth">
              <span class="material-symbols-outlined">chevron_right</span>
            </n-button>
          </div>

          <!-- Week Days Header -->
          <div class="week-days">
            <span v-for="day in weekDays" :key="day" class="week-day">{{ day }}</span>
          </div>

          <!-- Calendar Days -->
          <div class="calendar-days">
            <div
              v-for="day in calendarData.days"
              :key="day.date"
              :class="[
                'calendar-day',
                {
                  'not-current-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'selected': day.isSelected,
                  'has-transactions': day.transactions.length > 0
                }
              ]"
              @click="selectDate(day)"
            >
              <span class="day-number">{{ day.day }}</span>
              <span v-if="day.income > 0" class="day-income">+{{ day.income.toFixed(0) }}</span>
              <span v-if="day.expense > 0" class="day-expense">-{{ day.expense.toFixed(0) }}</span>
            </div>
          </div>
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
                <p class="stat-value income">{{ formatCurrency(calendarData.totalIncome) }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">{{ t('calendar.expense') }}</p>
                <p class="stat-value expense">{{ formatCurrency(calendarData.totalExpense) }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">{{ t('reports.balance') }}</p>
                <p class="stat-value">{{ formatCurrency(calendarData.balance) }}</p>
              </div>
            </div>
          </n-card>

          <!-- Selected Day Transactions -->
          <n-card class="day-transactions-card" :bordered="true">
            <template #header>
              <div class="card-header">
                <h2 class="day-title">{{ selectedDateDisplay }}</h2>
                <div class="day-summary">
                  <span>{{ t('calendar.income') }}: {{ formatCurrency(selectedDayData?.income || 0) }}</span>
                  <span>{{ t('calendar.expense') }}: {{ formatCurrency(selectedDayData?.expense || 0) }}</span>
                </div>
              </div>
            </template>

            <TransactionList 
              :transactions="selectedDayData?.transactions || []"
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

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .calendar-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.calendar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.calendar-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.icon-expand {
  font-size: 16px;
  color: var(--color-text-muted);
  margin-left: 4px;
}

/* 布局容器 */
.calendar-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calendar-left {
  flex: 1;
  min-width: 0;
}

.calendar-right {
  width: 100%;
}

/* 宽屏状态：左右布局 (≥1100px 才启用) */
@media (min-width: 1100px) {
  .calendar-layout {
    flex-direction: row;
  }
  
  .calendar-left {
    flex: 0 0 auto;
    width: 480px;
    flex-shrink: 0;
  }
  
  .calendar-right {
    flex: 1;
    min-width: 0;
  }
}

/* 日历卡片 */
.calendar-grid-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
  overflow: hidden;
}

.month-stats-card,
.day-transactions-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

/* 交易列表文本溢出处理 */
.day-transactions-card :deep(.n-thing-header__title),
.day-transactions-card :deep(.n-thing-main__description) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 月份导航 */
.month-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.current-month {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
  min-width: 120px;
  text-align: center;
}

/* 星期标题 */
.week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
  margin-bottom: 8px;
}

.week-day {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* 日历日期 */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  height: 70px;
  min-width: 0;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-day:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.calendar-day.not-current-month {
  opacity: 0.3;
}

.calendar-day.today {
  border-color: var(--color-primary);
}

.calendar-day.selected {
  border-color: color-mix(in srgb, var(--color-primary) 60%, transparent);
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.day-number {
  font-weight: 500;
  color: var(--color-text-strong);
}

.calendar-day.selected .day-number {
  font-weight: 700;
}

.day-income {
  font-size: 0.6875rem;
  color: var(--color-income);
}

.day-expense {
  font-size: 0.6875rem;
  color: var(--color-expense);
}

/* 统计卡片 */
.stats-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 4px 0 0 0;
  white-space: nowrap;
}

.stat-value.income {
  color: var(--color-income);
}

.stat-value.expense {
  color: var(--color-expense);
}

/* 日期交易卡片 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.day-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.day-summary {
  display: flex;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* 交易项 */
.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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

.empty-icon {
  font-size: 48px;
  color: var(--color-text-muted);
}
</style>
