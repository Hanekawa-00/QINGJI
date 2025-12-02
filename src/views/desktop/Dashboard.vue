<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user.store'

const userStore = useUserStore()

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// 统计卡片数据
const statsCards = computed(() => [
  {
    label: 'Current Balance',
    value: formatCurrency(userStore.statistics.totalBalance),
    subtitle: 'Cash + Accounts',
    color: 'primary'
  },
  {
    label: 'Monthly Income',
    value: formatCurrency(userStore.statistics.monthlyIncome),
    subtitle: 'Salary + Bonus',
    color: 'success'
  },
  {
    label: 'Monthly Spending',
    value: formatCurrency(userStore.statistics.monthlyExpense),
    subtitle: 'Cards + Cash',
    color: 'error'
  }
])

// 本周活动数据
const weeklyData = computed(() => userStore.statistics.weeklyActivity)
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 高亮数据
const highlights = computed(() => [
  {
    label: 'Income',
    value: `+${formatCurrency(userStore.statistics.monthlyIncome)}`,
    color: 'success'
  },
  {
    label: 'Spending',
    value: `-${formatCurrency(120.74)}`,
    color: 'error'
  },
  {
    label: 'Recurring',
    value: formatCurrency(320.00),
    color: 'text'
  }
])

// 最近交易
const recentTransactions = computed(() => userStore.recentTransactions.slice(0, 3))

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
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">Mirror of mobile flow, optimized for desktop.</p>
      </div>
      <div class="header-right">
        <button class="month-selector">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>May 2024</span>
          <span class="material-symbols-outlined icon-expand">expand_more</span>
        </button>
        <button class="add-button">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div
        v-for="(card, index) in statsCards"
        :key="index"
        class="stats-card"
      >
        <p class="stats-label">{{ card.label }}</p>
        <p :class="['stats-value', `stats-value-${card.color}`]">{{ card.value }}</p>
        <p class="stats-subtitle">{{ card.subtitle }}</p>
      </div>
    </section>

    <!-- 活动图表和高亮 -->
    <section class="activity-section">
      <!-- 本周活动 -->
      <div class="activity-chart">
        <div class="chart-header">
          <div>
            <p class="chart-label">This Week's Activity</p>
            <p class="chart-value">$1,230</p>
          </div>
          <span class="change-badge">+5.2%</span>
        </div>
        <div class="chart-bars">
          <div
            v-for="(value, index) in weeklyData"
            :key="index"
            class="chart-bar-wrapper"
          >
            <div 
              class="chart-bar" 
              :class="{ 'chart-bar-active': index === 2 }"
              :style="{ height: `${value}%` }"
            ></div>
          </div>
        </div>
        <div class="chart-labels">
          <span v-for="day in weekDays" :key="day" class="chart-label-item">{{ day }}</span>
        </div>
      </div>

      <!-- Highlights -->
      <div class="highlights-card">
        <div class="highlights-header">
          <p class="highlights-title">Highlights</p>
          <span class="material-symbols-outlined icon-tune">tune</span>
        </div>
        <div class="highlights-list">
          <div
            v-for="(item, index) in highlights"
            :key="index"
            class="highlight-item"
          >
            <span class="highlight-label">{{ item.label }}</span>
            <span :class="['highlight-value', `text-${item.color}`]">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 最近交易 -->
    <section class="transactions-section">
      <div class="transactions-header">
        <h2 class="transactions-title">Recent Transactions</h2>
        <button class="view-all-btn">View all</button>
      </div>
      <div class="transactions-list">
        <div
          v-for="transaction in recentTransactions"
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-left">
            <div class="transaction-icon">
              <span class="material-symbols-outlined">{{ transaction.categoryIcon }}</span>
            </div>
            <div class="transaction-info">
              <p class="transaction-name">{{ transaction.description }}</p>
              <p class="transaction-category">{{ transaction.category }}</p>
            </div>
          </div>
          <span :class="['transaction-amount', getAmountClass(transaction.type)]">
            {{ formatTransactionAmount(transaction) }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped src="@/styles/views/desktop-dashboard.css"></style>
