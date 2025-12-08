<script setup lang="ts">
/**
 * 移动端报表页面
 * 功能与桌面端 1:1 对应
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Empty as VanEmpty } from 'vant'
import 'vant/es/empty/style'

import YearMonthPicker from '@/components/common/YearMonthPicker.vue'

import { useUserStore } from '@/stores/user.store'
import { useCurrencyFormat } from '@/hooks'
import { BarLineChart, PieChart } from '@/components/common/charts'
import type { ReportPeriod } from '@/types'

defineOptions({ name: 'MobileReports' })

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// ==================== 期间选择 ====================
const selectedPeriod = ref<ReportPeriod>('month')
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth())

// 月份/年份显示
const periodDisplay = computed(() => {
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  if (selectedPeriod.value === 'month') {
    const date = new Date(selectedYear.value, selectedMonth.value)
    return date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' })
  }
  return String(selectedYear.value)
})

// 切换到上一期间
const goToPrevious = () => {
  if (selectedPeriod.value === 'month') {
    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  } else {
    selectedYear.value--
  }
}

// 切换到下一期间
const goToNext = () => {
  if (selectedPeriod.value === 'month') {
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  } else {
    selectedYear.value++
  }
}

// 年月选择器
const showYearMonthPicker = ref(false)

// 选择器模式：月份模式显示年月，年份模式只显示年
const pickerMode = computed(() => selectedPeriod.value === 'year' ? 'year' : 'year-month')

const onYearMonthConfirm = (year: number, month: number) => {
  selectedYear.value = year
  if (selectedPeriod.value === 'month') {
    selectedMonth.value = month - 1 // YearMonthPicker 使用 1-12，这里需要 0-11
  }
}

// ==================== 统计数据 ====================
const periodStats = computed(() => {
  return userStore.getPeriodStatistics(
    selectedPeriod.value,
    selectedYear.value,
    selectedPeriod.value === 'month' ? selectedMonth.value : undefined
  )
})

// 格式化变化百分比
const formatChangePercentage = (value: number) => {
  const sign = value >= 0 ? '↑' : '↓'
  return `${sign} ${Math.abs(value).toFixed(1)}%`
}

// ==================== 统计图表 ====================
type ChartViewType = 'bar' | 'line'
const chartViewType = ref<ChartViewType>('bar')

type ChartDataType = 'expense' | 'income' | 'both'
const chartDataType = ref<ChartDataType>('both')

// ECharts 图表数据
const echartsData = computed(() => {
  const { expenseStats, incomeStats } = periodStats.value
  
  const labels = selectedPeriod.value === 'month'
    ? Array.from({ length: expenseStats.length }, (_, i) => String(i + 1))
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  
  return labels.map((label, i) => ({
    label,
    income: incomeStats[i] ?? 0,
    expense: expenseStats[i] ?? 0
  }))
})

// ==================== 分类报告 ====================
const selectedCategoryType = ref<'expense' | 'income'>('expense')

const filteredCategoryReports = computed(() => {
  return selectedCategoryType.value === 'expense' 
    ? periodStats.value.expenseCategoryReports 
    : periodStats.value.incomeCategoryReports
})

const pieChartTotal = computed(() => {
  return selectedCategoryType.value === 'expense' 
    ? periodStats.value.totalExpense 
    : periodStats.value.totalIncome
})

// 饼图数据
const pieChartData = computed(() => {
  return filteredCategoryReports.value.slice(0, 6).map(report => ({
    name: report.categoryName,
    value: report.totalAmount,
    color: report.categoryColor
  }))
})

// ==================== 收支报告列表 ====================
const reportData = computed(() => {
  if (selectedPeriod.value === 'month') {
    return periodStats.value.dailyReports.slice(0, 15)
  }
  return periodStats.value.monthlyReports
})

// 返回上一页
const goBack = () => router.back()
</script>

<template>
  <div class="mobile-reports">
    <!-- 顶部导航：第一行 - 返回按钮 + 年/月切换 -->
    <header class="mobile-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      
      <!-- 期间类型切换（居中） -->
      <div class="period-switch">
        <label class="switch-option" :class="{ active: selectedPeriod === 'month' }">
          <input type="radio" v-model="selectedPeriod" value="month" />
          <span>{{ t('reports.month') }}</span>
        </label>
        <label class="switch-option" :class="{ active: selectedPeriod === 'year' }">
          <input type="radio" v-model="selectedPeriod" value="year" />
          <span>{{ t('reports.year') }}</span>
        </label>
      </div>
      
      <div class="header-spacer" />
    </header>

    <!-- 第二行：月份/年份选择器 -->
    <div class="period-nav">
      <button class="nav-btn" @click="goToPrevious">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <button 
        class="period-display" 
        @click="showYearMonthPicker = true"
      >
        <span>{{ periodDisplay }}</span>
        <span class="material-symbols-outlined arrow-icon">keyboard_arrow_down</span>
      </button>
      <button class="nav-btn" @click="goToNext">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <!-- 支出 -->
        <div class="stat-card">
          <span class="stat-label">{{ t('reports.expense') }}</span>
          <span class="stat-value expense">{{ formatCurrency(periodStats.totalExpense) }}</span>
          <span :class="['stat-change', periodStats.expenseChange >= 0 ? 'up' : 'down']">
            {{ formatChangePercentage(periodStats.expenseChange) }}
          </span>
        </div>
        
        <!-- 收入 -->
        <div class="stat-card">
          <span class="stat-label">{{ t('reports.income') }}</span>
          <span class="stat-value income">{{ formatCurrency(periodStats.totalIncome) }}</span>
          <span class="stat-change muted">
            {{ periodStats.totalIncome > 0 ? t('reports.incomeLogged') : t('reports.noIncomeLogged') }}
          </span>
        </div>
        
        <!-- 结余 -->
        <div class="stat-card">
          <span class="stat-label">{{ t('reports.balance') }}</span>
          <span :class="['stat-value', periodStats.balance >= 0 ? 'income' : 'expense']">
            {{ formatCurrency(periodStats.balance) }}
          </span>
          <span class="stat-change muted">
            {{ periodStats.balance >= 0 ? t('reports.surplus') : t('reports.needsAttention') }}
          </span>
        </div>
        
        <!-- 日均支出 -->
        <div class="stat-card">
          <span class="stat-label">{{ t('reports.avgDailyExpense') }}</span>
          <span class="stat-value">{{ formatCurrency(periodStats.avgDailyExpense) }}</span>
          <span class="stat-change muted">{{ t('reports.steadySpending') }}</span>
        </div>
      </div>
    </div>

    <!-- 统计图表 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>{{ selectedPeriod === 'month' ? t('reports.dailyStatistics') : t('reports.monthlyStatistics') }}</h3>
        <div class="chart-controls">
          <!-- 图表类型切换 -->
          <button 
            :class="['chart-type-btn', { active: chartViewType === 'bar' }]"
            @click="chartViewType = 'bar'"
          >
            <span class="material-symbols-outlined">bar_chart</span>
          </button>
          <button 
            :class="['chart-type-btn', { active: chartViewType === 'line' }]"
            @click="chartViewType = 'line'"
          >
            <span class="material-symbols-outlined">show_chart</span>
          </button>
        </div>
      </div>
      
      <!-- 数据类型切换 -->
      <div class="data-type-switch">
        <button 
          :class="{ active: chartDataType === 'expense' }"
          @click="chartDataType = 'expense'"
        >{{ t('reports.expense') }}</button>
        <button 
          :class="{ active: chartDataType === 'income' }"
          @click="chartDataType = 'income'"
        >{{ t('reports.income') }}</button>
        <button 
          :class="{ active: chartDataType === 'both' }"
          @click="chartDataType = 'both'"
        >{{ t('common.all') }}</button>
      </div>
      
      <!-- ECharts 图表 -->
      <BarLineChart
        :data="echartsData"
        :type="chartViewType"
        :show-income="chartDataType === 'income' || chartDataType === 'both'"
        :show-expense="chartDataType === 'expense' || chartDataType === 'both'"
        height="200px"
      />
    </div>

    <!-- 分类报告 -->
    <div class="category-card">
      <div class="category-header">
        <h3>{{ t('reports.categorizedReport') }}</h3>
        <div class="type-switch">
          <button 
            :class="{ active: selectedCategoryType === 'expense' }"
            @click="selectedCategoryType = 'expense'"
          >{{ t('reports.expense') }}</button>
          <button 
            :class="{ active: selectedCategoryType === 'income' }"
            @click="selectedCategoryType = 'income'"
          >{{ t('reports.income') }}</button>
        </div>
      </div>

      <template v-if="filteredCategoryReports.length > 0">
        <!-- 饼图 - 居中显示 -->
        <div class="m-pie-wrapper">
          <PieChart
            :data="pieChartData"
            :center-label="selectedCategoryType === 'expense' ? t('reports.expense') : t('reports.income')"
            :center-value="formatCurrency(pieChartTotal)"
            height="160px"
          />
        </div>

        <!-- 分类详情列表 - 紧凑样式 -->
        <div class="m-category-list">
          <div
            v-for="report in filteredCategoryReports.slice(0, 5)"
            :key="report.categoryId"
            class="m-category-item"
          >
            <div 
              class="m-cat-icon"
              :style="{ 
                backgroundColor: `${report.categoryColor}20`,
                color: report.categoryColor
              }"
            >
              <span class="material-symbols-outlined">{{ report.categoryIcon }}</span>
            </div>
            <span class="m-cat-name">{{ report.categoryName }}</span>
            <div class="m-cat-bar">
              <div 
                class="m-progress-bar" 
                :style="{ 
                  width: `${report.percentage}%`,
                  backgroundColor: report.categoryColor
                }"
              />
            </div>
            <span class="m-cat-amount">{{ formatCurrency(report.totalAmount) }}</span>
            <span class="m-cat-percent">{{ report.percentage.toFixed(0) }}%</span>
          </div>
        </div>
      </template>

      <van-empty 
        v-else 
        :description="t('reports.noData')"
        image="search"
      />
    </div>

    <!-- 收支报告列表 -->
    <div class="report-list-card">
      <div class="report-list-header">
        <h3>{{ selectedPeriod === 'month' ? t('reports.dailyReport') : t('reports.monthlyReport') }}</h3>
        <span class="report-subtitle">
          {{ t('reports.avgDailyExpense') }}: {{ formatCurrency(periodStats.avgDailyExpense) }}
        </span>
      </div>
      
      <div v-if="reportData.length > 0" class="report-list">
        <div 
          v-for="item in reportData" 
          :key="item.date"
          class="report-item"
        >
          <span class="report-date">{{ item.date }}</span>
          <span class="report-income">{{ formatCurrency(item.income) }}</span>
          <span class="report-expense">{{ formatCurrency(item.expense) }}</span>
          <span :class="['report-balance', item.balance >= 0 ? 'income' : 'expense']">
            {{ formatCurrency(item.balance) }}
          </span>
        </div>
      </div>
      
      <van-empty v-else :description="t('reports.noData')" image="search" />
    </div>

    <!-- 年月选择器 -->
    <YearMonthPicker
      v-model:show="showYearMonthPicker"
      :year="selectedYear"
      :month="selectedMonth + 1"
      :mode="pickerMode"
      @confirm="onYearMonthConfirm"
    />
  </div>
</template>

<style scoped>
.mobile-reports {
  min-height: 100%;
  background: var(--color-background);
  padding-bottom: 24px;
}

/* 顶部导航：第一行 */
.mobile-header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
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
  flex-shrink: 0;
}

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.header-spacer {
  width: 32px;
  flex-shrink: 0;
}

/* 年/月切换 */
.period-switch {
  display: flex;
  height: 36px;
  padding: 4px;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.switch-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.switch-option input {
  display: none;
}

.switch-option.active {
  background: var(--color-primary);
  color: white;
}

/* 第二行：月份/年份导航 */
.period-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 16px;
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

.period-display {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 100px;
  padding: 4px 12px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  text-align: center;
  cursor: pointer;
}

.period-display .arrow-icon {
  font-size: 18px;
  color: var(--color-text-muted);
}

/* 统计卡片 */
.stats-section {
  padding: 0 16px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-strong);
}

.stat-value.income {
  color: var(--color-income);
}

.stat-value.expense {
  color: var(--color-expense);
}

.stat-change {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-change.up {
  color: var(--color-expense);
}

.stat-change.down {
  color: var(--color-income);
}

.stat-change.muted {
  color: var(--color-text-muted);
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
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 4px;
}

.chart-type-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-type-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.chart-type-btn .material-symbols-outlined {
  font-size: 18px;
}

.data-type-switch {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.data-type-switch button {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.data-type-switch button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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
  font-size: 14px;
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
  color: white;
}

/* 饼图 - 居中 */
.m-pie-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

/* 分类详情列表 - 紧凑单行样式 (m- 前缀避免全局样式冲突) */
.m-category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.m-category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.m-category-item:last-child {
  border-bottom: none;
}

.m-cat-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.m-cat-icon .material-symbols-outlined {
  font-size: 14px;
}

.m-cat-name {
  width: 48px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-strong);
  flex-shrink: 0;
}

.m-cat-bar {
  flex: 1;
  height: 6px;
  background: var(--color-background);
  border-radius: 3px;
  overflow: hidden;
}

.m-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.m-cat-amount {
  width: 70px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-strong);
  text-align: right;
  flex-shrink: 0;
}

.m-cat-percent {
  width: 32px;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  flex-shrink: 0;
}

/* 收支报告列表 */
.report-list-card {
  margin: 0 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.report-list-header {
  margin-bottom: 12px;
}

.report-list-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0 0 4px 0;
}

.report-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.report-list {
  display: flex;
  flex-direction: column;
}

.report-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}

.report-item:last-child {
  border-bottom: none;
}

.report-date {
  color: var(--color-text-muted);
}

.report-income {
  color: var(--color-income);
  text-align: right;
}

.report-expense {
  color: var(--color-expense);
  text-align: right;
}

.report-balance {
  text-align: right;
  font-weight: 500;
}

.report-balance.income {
  color: var(--color-income);
}

.report-balance.expense {
  color: var(--color-expense);
}

/* 空状态 */
:deep(.van-empty) {
  padding: 40px 0;
}

:deep(.van-empty__description) {
  color: var(--color-text-muted);
}
</style>
