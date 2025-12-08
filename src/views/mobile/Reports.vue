<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Empty as VanEmpty } from 'vant'
import 'vant/es/empty/style'

import { useUserStore } from '@/stores/user.store'
import { useCurrencyFormat } from '@/hooks'
import type { TransactionType } from '@/types'

defineOptions({ name: 'MobileReports' })

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 返回上一页
const goBack = () => router.back()

// 当前年月
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// 月份显示
const monthDisplay = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'short' })
})

// 周期类型
const periodType = ref<'month' | 'year'>('month')

// 报表类型（支出/收入）
const reportType = ref<TransactionType>('expense')

// 切换月份
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// 当月交易数据
const monthTransactions = computed(() => {
  return userStore.transactions.filter(t => {
    const txDate = new Date(t.date)
    return txDate.getFullYear() === currentYear.value && 
           txDate.getMonth() === currentMonth.value
  })
})

// 统计数据
const stats = computed(() => {
  let income = 0
  let expense = 0
  
  monthTransactions.value.forEach(t => {
    if (t.type === 'income') {
      income += t.convertedAmount ?? t.amount
    } else {
      expense += t.convertedAmount ?? t.amount
    }
  })
  
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const avgDaily = expense / daysInMonth
  
  return {
    income,
    expense,
    balance: income - expense,
    avgDaily
  }
})

// 每日数据（用于图表）
const dailyData = computed(() => {
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const data: number[] = []
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayExpense = monthTransactions.value
      .filter(t => t.date === dateStr && t.type === 'expense')
      .reduce((sum, t) => sum + (t.convertedAmount ?? t.amount), 0)
    data.push(dayExpense)
  }
  
  return data
})

const maxDailyAmount = computed(() => Math.max(...dailyData.value, 1))

// 分类统计
const categoryStats = computed(() => {
  const stats: Record<string, { name: string; icon: string; amount: number }> = {}
  
  monthTransactions.value
    .filter(t => t.type === reportType.value)
    .forEach(t => {
      if (!stats[t.category]) {
        stats[t.category] = {
          name: t.category,
          icon: t.categoryIcon || 'category',
          amount: 0
        }
      }
      stats[t.category].amount += t.convertedAmount ?? t.amount
    })
  
  return Object.values(stats).sort((a, b) => b.amount - a.amount)
})

// 分类总额
const categoryTotal = computed(() => {
  return categoryStats.value.reduce((sum, cat) => sum + cat.amount, 0)
})

// 计算百分比
const getPercentage = (amount: number) => {
  if (categoryTotal.value === 0) return 0
  return Math.round((amount / categoryTotal.value) * 100)
}

// 分类颜色
const categoryColors = ['#36a2e8', '#f6b756', '#ef5f9a', '#8b7bff', '#4de6a5', '#ff6b6b']
</script>

<template>
  <div class="mobile-reports">
    <!-- 顶部导航 -->
    <header class="reports-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div class="month-nav">
        <button class="nav-btn" @click="prevMonth">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="month-title">{{ monthDisplay }}</span>
        <button class="nav-btn" @click="nextMonth">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div class="header-spacer" />
    </header>

    <!-- 周期切换 -->
    <div class="period-switch">
      <div class="switch-wrapper">
        <label class="switch-option" :class="{ active: periodType === 'month' }">
          <input type="radio" v-model="periodType" value="month" />
          <span>{{ t('reports.monthly') }}</span>
        </label>
        <label class="switch-option" :class="{ active: periodType === 'year' }">
          <input type="radio" v-model="periodType" value="year" />
          <span>{{ t('reports.yearly') }}</span>
        </label>
      </div>
    </div>

    <!-- 统计卡片网格 -->
    <div class="stats-card">
      <div class="stats-header">
        <h3>{{ t('reports.incomeVsExpense') }}</h3>
        <span class="stats-period">{{ monthDisplay }}</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">{{ t('reports.expense') }}</span>
          <span class="stat-value">{{ formatCurrency(stats.expense) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('reports.income') }}</span>
          <span class="stat-value income">{{ formatCurrency(stats.income) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('dashboard.currentBalance') }}</span>
          <span class="stat-value" :class="stats.balance >= 0 ? 'income' : 'expense'">
            {{ formatCurrency(stats.balance) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('reports.avgDaily') }}</span>
          <span class="stat-value">{{ formatCurrency(stats.avgDaily) }}</span>
        </div>
      </div>
    </div>

    <!-- 每日统计图表 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>{{ t('reports.dailyStats') }}</h3>
      </div>
      <div class="chart-container">
        <div class="chart-bars">
          <div 
            v-for="(amount, index) in dailyData.slice(0, 14)" 
            :key="index"
            class="chart-bar"
            :style="{ height: `${Math.max((amount / maxDailyAmount) * 100, 5)}%` }"
            :class="{ highlight: index === new Date().getDate() - 1 }"
          />
        </div>
        <div class="chart-labels">
          <span>01</span>
          <span>07</span>
          <span>14</span>
        </div>
      </div>
    </div>

    <!-- 分类报表 -->
    <div class="category-card">
      <div class="category-header">
        <h3>{{ t('reports.byCategory') }}</h3>
        <div class="type-switch">
          <button 
            :class="{ active: reportType === 'expense' }"
            @click="reportType = 'expense'"
          >
            {{ t('reports.expense') }}
          </button>
          <button 
            :class="{ active: reportType === 'income' }"
            @click="reportType = 'income'"
          >
            {{ t('reports.income') }}
          </button>
        </div>
      </div>

      <template v-if="categoryStats.length > 0">
        <div class="category-list">
          <div 
            v-for="(cat, index) in categoryStats" 
            :key="cat.name"
            class="category-item"
          >
            <div 
              class="cat-icon" 
              :style="{ backgroundColor: categoryColors[index % categoryColors.length] + '20', color: categoryColors[index % categoryColors.length] }"
            >
              <span class="material-symbols-outlined">{{ cat.icon }}</span>
            </div>
            <div class="cat-info">
              <div class="cat-row">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-amount">{{ formatCurrency(cat.amount) }}</span>
              </div>
              <div class="cat-row sub">
                <span class="cat-percent">{{ getPercentage(cat.amount) }}%</span>
              </div>
              <div class="cat-progress">
                <div 
                  class="progress-bar" 
                  :style="{ 
                    width: `${getPercentage(cat.amount)}%`,
                    backgroundColor: categoryColors[index % categoryColors.length]
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <van-empty 
        v-else 
        :description="t('reports.noData')"
        image="search"
      />
    </div>
  </div>
</template>

<style scoped>
.mobile-reports {
  min-height: 100%;
  background: var(--color-background);
  padding-bottom: 100px;
}

/* 顶部导航 */
.reports-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-btn .material-symbols-outlined {
  font-size: 18px;
}

.month-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  min-width: 90px;
  text-align: center;
}

.header-spacer {
  width: 32px;
}

/* 周期切换 */
.period-switch {
  display: flex;
  justify-content: center;
  padding: 16px 16px 0;
}

.switch-wrapper {
  display: flex;
  height: 36px;
  padding: 4px;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.switch-option input {
  display: none;
}

.switch-option.active {
  background: var(--color-primary);
  color: var(--color-background);
}

/* 统计卡片 */
.stats-card {
  margin: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.stats-period {
  font-size: 12px;
  color: var(--color-text-muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-primary-alpha-10);
}

.stat-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-strong);
}

.stat-value.income {
  color: var(--color-income);
}

.stat-value.expense {
  color: var(--color-expense);
}

/* 图表卡片 */
.chart-card {
  margin: 0 16px 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.chart-container {
  padding: 12px;
  border-radius: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
}

.chart-bar {
  flex: 1;
  min-height: 4px;
  background: var(--color-primary-alpha-30);
  border-radius: 2px;
  transition: height 0.3s;
}

.chart-bar.highlight {
  background: var(--color-primary);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 分类卡片 */
.category-card {
  margin: 0 16px 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.category-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.type-switch {
  display: flex;
  height: 32px;
  padding: 3px;
  border-radius: 999px;
  background: var(--color-background);
}

.type-switch button {
  padding: 0 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.type-switch button.active {
  background: var(--color-primary);
  color: var(--color-background);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-icon .material-symbols-outlined {
  font-size: 18px;
}

.cat-info {
  flex: 1;
}

.cat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-row.sub {
  margin-top: 2px;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.cat-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.cat-percent {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cat-progress {
  height: 4px;
  background: var(--color-background);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

/* 空状态 */
:deep(.van-empty) {
  padding: 40px 0;
}

:deep(.van-empty__description) {
  color: var(--color-text-muted);
}
</style>
