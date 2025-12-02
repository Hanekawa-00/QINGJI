<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'
import type { CalendarDay, MonthCalendar } from '@/types'

const userStore = useUserStore()

// 当前选择的年月
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth())
const selectedDate = ref(currentDate.toISOString().split('T')[0])

// 星期标签
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

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
    
    // 获取该日的交易
    const dayTransactions = userStore.transactions.filter(t => t.date === dateStr)
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
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

// 格式化交易金额
const formatTransactionAmount = (transaction: any) => {
  const amount = formatCurrency(transaction.amount)
  return transaction.type === 'income' ? `+${amount}` : `-${amount}`
}

// 获取交易金额颜色类
const getAmountClass = (type: string) => {
  return type === 'income' ? 'text-income' : 'text-expense'
}
</script>

<template>
  <div class="calendar">
    <!-- Header -->
    <header class="calendar-header">
      <div class="header-left">
        <h1 class="calendar-title">Calendar</h1>
        <p class="calendar-subtitle">Same logic as mobile calendar, tuned for desktop.</p>
      </div>
      <div class="header-right">
        <button class="month-selector">
          <span class="material-symbols-outlined">calendar_month</span>
          <span>{{ monthYearDisplay }}</span>
          <span class="material-symbols-outlined icon-expand">expand_more</span>
        </button>
        <button class="add-button">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <section class="calendar-content">
      <!-- Calendar Grid -->
      <div class="calendar-grid-panel">
        <!-- Month Navigation -->
        <div class="month-navigation">
          <button class="nav-btn" @click="goToPreviousMonth">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 class="current-month">{{ monthYearDisplay }}</h2>
          <button class="nav-btn" @click="goToNextMonth">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
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
      </div>

      <!-- Right Panel: Stats & Transactions -->
      <div class="right-panel">
        <!-- Month Statistics -->
        <div class="month-stats-card">
          <div class="stat-item">
            <p class="stat-label">Income</p>
            <p class="stat-value income">{{ formatCurrency(calendarData.totalIncome) }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Expense</p>
            <p class="stat-value expense">{{ formatCurrency(calendarData.totalExpense) }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Balance</p>
            <p class="stat-value">{{ formatCurrency(calendarData.balance) }}</p>
          </div>
        </div>

        <!-- Selected Day Transactions -->
        <div class="day-transactions-card">
          <div class="card-header">
            <h2 class="day-title">{{ selectedDateDisplay }}</h2>
            <div class="day-summary">
              <span>In: {{ formatCurrency(selectedDayData?.income || 0) }}</span>
              <span>Out: {{ formatCurrency(selectedDayData?.expense || 0) }}</span>
            </div>
          </div>

          <div class="transactions-list">
            <div
              v-if="selectedDayData && selectedDayData.transactions.length > 0"
              v-for="transaction in selectedDayData.transactions"
              :key="transaction.id"
              class="transaction-item"
            >
              <div 
                class="transaction-icon"
                :class="transaction.type"
              >
                <span class="material-symbols-outlined">{{ transaction.categoryIcon }}</span>
              </div>
              <div class="transaction-info">
                <p class="transaction-name">{{ transaction.description }}</p>
                <p class="transaction-category">{{ transaction.category }}</p>
              </div>
              <span :class="['transaction-amount', getAmountClass(transaction.type)]">
                {{ formatTransactionAmount(transaction) }}
              </span>
            </div>
            <div v-else class="empty-state">
              <span class="material-symbols-outlined">event_busy</span>
              <p>No transactions on this day</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped src="@/styles/views/desktop-calendar.css"></style>
