<script setup lang="ts">
/**
 * 日历网格组件
 * 跨平台复用（桌面端/移动端）
 * 内置 useCalendar hook
 */
import { ref, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user.store'
import { useCalendar, useCurrencyFormat } from '@/hooks'
import YearMonthPicker from './YearMonthPicker.vue'
import type { CalendarDay } from '@/types'

interface Props {
  // 是否显示收支数据
  showStats?: boolean
  // 是否紧凑模式（移动端）
  compact?: boolean
  // 是否显示返回按钮
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showStats: true,
  compact: false,
  showBack: false
})

const emit = defineEmits<{
  'select': [day: CalendarDay]
  'month-change': [year: number, month: number]
  'month-click': []
  'back': []
}>()

const { locale } = useI18n()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 使用日历 hook
const {
  selectedYear,
  selectedMonth,
  selectedDate,
  weekDays,
  weekDaysCN,
  calendarData,
  selectedDayData,
  selectDate: hookSelectDate,
  goToPreviousMonth: hookPrevMonth,
  goToNextMonth: hookNextMonth
} = useCalendar({
  transactions: toRef(userStore, 'transactions')
})

// 本地化星期标题
const localizedWeekDays = computed(() => {
  return locale.value === 'zh-CN' ? weekDaysCN : weekDays
})

// 月份显示（本地化）
const monthDisplay = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value)
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' })
})

// 选中日期显示
const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
})

// 月度统计
const monthStats = computed(() => ({
  income: calendarData.value.totalIncome,
  expense: calendarData.value.totalExpense,
  balance: calendarData.value.balance
}))

// 格式化日期内的金额显示
const formatDayAmount = (amount: number) => {
  if (props.compact) {
    // 紧凑模式：只显示整数
    return Math.round(amount)
  }
  // 正常模式：保留整数
  return amount.toFixed(0)
}

// 选择日期
const handleSelectDate = (day: CalendarDay) => {
  if (day.isCurrentMonth) {
    hookSelectDate(day)
    emit('select', day)
  }
}

// 切换月份
const goToPreviousMonth = () => {
  hookPrevMonth()
  emit('month-change', selectedYear.value, selectedMonth.value)
}

const goToNextMonth = () => {
  hookNextMonth()
  emit('month-change', selectedYear.value, selectedMonth.value)
}

// 设置年月
const setYearMonth = (year: number, month: number) => {
  selectedYear.value = year
  selectedMonth.value = month
  emit('month-change', selectedYear.value, selectedMonth.value)
}

// 年月选择器
const showYearMonthPicker = ref(false)

const onYearMonthConfirm = (year: number, month: number) => {
  setYearMonth(year, month - 1)  // YearMonthPicker 使用 1-12，内部使用 0-11
}

// 暴露给父组件的数据和方法
defineExpose({
  selectedYear,
  selectedMonth,
  selectedDate,
  selectedDayData,
  selectedDateDisplay,
  monthStats,
  calendarData,
  formatCurrency,
  setYearMonth
})
</script>

<template>
  <div class="calendar-grid" :class="{ compact }">
    <!-- 月份导航 -->
    <div class="month-nav">
      <!-- 返回按钮（可选） -->
      <button v-if="showBack" class="back-btn" @click="emit('back')">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      
      <button class="nav-btn" @click="goToPreviousMonth">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <button class="month-title" @click="showYearMonthPicker = true">
          <span>{{ monthDisplay }}</span>
          <span class="material-symbols-outlined arrow-icon">keyboard_arrow_down</span>
        </button>
      <button class="nav-btn" @click="goToNextMonth">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <!-- 年月选择器弹窗 -->
    <YearMonthPicker
      v-model:show="showYearMonthPicker"
      :year="selectedYear"
      :month="selectedMonth + 1"
      @confirm="onYearMonthConfirm"
    />

    <!-- 星期标题 -->
    <div class="week-header">
      <span v-for="day in localizedWeekDays" :key="day" class="week-day">{{ day }}</span>
    </div>

    <!-- 日期网格 (42天) -->
    <div class="days-grid">
      <div
        v-for="day in calendarData.days"
        :key="day.date"
        class="day-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'selected': day.isSelected,
          'has-data': day.income > 0 || day.expense > 0
        }"
        @click="handleSelectDate(day)"
      >
        <span class="day-number">{{ day.day }}</span>
        <template v-if="showStats && day.isCurrentMonth">
          <span v-if="day.income > 0" class="day-income">+{{ formatDayAmount(day.income) }}</span>
          <span v-if="day.expense > 0" class="day-expense">-{{ formatDayAmount(day.expense) }}</span>
        </template>
      </div>
    </div>

    <!-- 插槽：月度统计（可选） -->
    <slot name="stats" :stats="monthStats" :format="formatCurrency" />

    <!-- 插槽：选中日期详情（可选） -->
    <slot 
      name="day-detail" 
      :day="selectedDayData" 
      :display="selectedDateDisplay"
      :format="formatCurrency" 
    />
  </div>
</template>

<style scoped>
.calendar-grid {
  --cell-size: 80px;
  --cell-gap: 4px;
  --font-size-day: 16px;
  --font-size-amount: 11px;
}

.calendar-grid.compact {
  --cell-size: 48px;
  --cell-gap: 2px;
  --font-size-day: 14px;
  --font-size-amount: 9px;
}

/* 月份导航 */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 12px;
  min-width: 0;
}

.back-btn {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 4px;
}

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.nav-btn {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  color: var(--color-text-strong);
}

.nav-btn .material-symbols-outlined {
  font-size: 20px;
}

.month-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
  min-width: 0;
  max-width: 160px;
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 8px;
  min-height: var(--touch-target-min);
  border-radius: 8px;
}

.month-title span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-title:active {
  background: var(--color-surface-hover);
}

.month-title .arrow-icon {
  font-size: 18px;
  color: var(--color-text-muted);
}

.compact .month-title {
  font-size: 15px;
  max-width: 128px;
}

/* 星期标题 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.week-day {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0;
}

.compact .week-day {
  font-size: 11px;
  padding: 4px 0;
}

/* 日期网格 */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--cell-gap);
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--cell-size);
  padding: 4px 2px;
  border-radius: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.compact .day-cell {
  min-height: 56px;
  border-radius: 10px;
}

.day-cell:hover {
  background: var(--color-surface);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.today {
  border-color: var(--color-primary-alpha-60);
}

.day-cell.selected {
  background: var(--color-primary-alpha-20);
  border-color: var(--color-primary);
}

.day-number {
  font-size: var(--font-size-day);
  font-weight: 500;
  color: var(--color-text-strong);
}

.day-cell.selected .day-number {
  font-weight: 700;
}

.day-income {
  font-size: var(--font-size-amount);
  color: var(--color-income);
  margin-top: 2px;
}

.day-expense {
  font-size: var(--font-size-amount);
  color: var(--color-expense);
}
</style>
