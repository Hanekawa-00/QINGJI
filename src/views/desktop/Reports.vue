<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'
import type { ReportPeriod } from '@/types'

const userStore = useUserStore()

// 当前选择的期间类型
const selectedPeriod = ref<ReportPeriod>('month')

// 当前选择的年月
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth())

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// 格式化日期显示
const dateDisplay = computed(() => {
  if (selectedPeriod.value === 'month') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[selectedMonth.value]} ${selectedYear.value}`
  } else {
    return `${selectedYear.value}`
  }
})

// 获取当前期间的统计数据
const periodStats = computed(() => {
  return userStore.getPeriodStatistics(
    selectedPeriod.value,
    selectedYear.value,
    selectedPeriod.value === 'month' ? selectedMonth.value : undefined
  )
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

// 格式化变化百分比
const formatChangePercentage = (value: number) => {
  const sign = value >= 0 ? '↑' : '↓'
  return `${sign} ${Math.abs(value).toFixed(1)}%`
}

// 获取最大支出值（用于归一化柱状图高度）
const maxDailyExpense = computed(() => {
  return Math.max(...periodStats.value.dailyStats, 1)
})

// 归一化柱状图高度
const normalizeHeight = (value: number) => {
  return (value / maxDailyExpense.value) * 100
}

// 当前选择的分类类型（expense/income）
const selectedCategoryType = ref<'expense' | 'income'>('expense')

// 过滤后的分类报告
const filteredCategoryReports = computed(() => {
  return periodStats.value.categoryReports
})

// 格式化日期（用于每日报告）
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`
}

// 图表标签
const chartLabels = computed(() => {
  if (selectedPeriod.value === 'month') {
    // 显示月初、月中、月末日期
    const year = selectedYear.value
    const month = selectedMonth.value + 1
    return [
      `${month}-01`,
      `${month}-15`,
      `${month}-30`
    ]
  } else {
    // 显示季度
    return ['Q1', 'Q2', 'Q3', 'Q4']
  }
})
</script>

<template>
  <div class="reports">
    <!-- Header -->
    <header class="reports-header">
      <div class="header-left">
        <h1 class="reports-title">Statistical Report</h1>
        <p class="reports-subtitle">Desktop view, same logic as mobile stats.</p>
      </div>
      <div class="header-right">
        <!-- 期间选择器 -->
        <div class="period-selector">
          <button class="period-nav-btn" @click="goToPrevious">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="period-display">{{ dateDisplay }}</span>
          <button class="period-nav-btn" @click="goToNext">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <!-- 期间类型切换 -->
        <div class="period-type-selector">
          <label class="period-type-option">
            <input 
              type="radio" 
              name="period" 
              value="month"
              v-model="selectedPeriod"
            />
            <span>Month</span>
          </label>
          <label class="period-type-option">
            <input 
              type="radio" 
              name="period" 
              value="year"
              v-model="selectedPeriod"
            />
            <span>Year</span>
          </label>
        </div>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div class="stats-card">
        <p class="stats-label">Expense</p>
        <p class="stats-value">{{ formatCurrency(periodStats.totalExpense) }}</p>
        <p :class="['stats-change', periodStats.expenseChange >= 0 ? 'text-pink' : 'text-primary']">
          {{ formatChangePercentage(periodStats.expenseChange) }} vs last {{ selectedPeriod }}
        </p>
      </div>

      <div class="stats-card">
        <p class="stats-label">Income</p>
        <p class="stats-value">{{ formatCurrency(periodStats.totalIncome) }}</p>
        <p class="stats-change text-muted">
          {{ periodStats.totalIncome > 0 ? 'Income logged' : 'No income logged' }}
        </p>
      </div>

      <div class="stats-card">
        <p class="stats-label">Balance</p>
        <p :class="['stats-value', periodStats.balance >= 0 ? 'text-primary' : 'text-pink']">
          {{ formatCurrency(periodStats.balance) }}
        </p>
        <p class="stats-change text-muted">
          {{ periodStats.balance >= 0 ? 'Surplus' : 'Needs attention' }}
        </p>
      </div>

      <div class="stats-card">
        <p class="stats-label">Avg. Daily Expense</p>
        <p class="stats-value">{{ formatCurrency(periodStats.avgDailyExpense) }}</p>
        <p class="stats-change text-muted">Steady spending</p>
      </div>
    </section>

    <!-- 图表和分类报告 -->
    <section class="charts-section">
      <!-- 每日统计图表 -->
      <div class="daily-chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Daily Statistics</h3>
          <div class="chart-actions">
            <span class="material-symbols-outlined icon-active">bar_chart</span>
            <span class="material-symbols-outlined">show_chart</span>
          </div>
        </div>

        <div class="chart-content">
          <!-- Y轴标签 -->
          <div class="chart-y-axis">
            <span>{{ Math.round(maxDailyExpense) }}</span>
            <span>{{ Math.round(maxDailyExpense * 0.66) }}</span>
            <span>{{ Math.round(maxDailyExpense * 0.33) }}</span>
            <span>0</span>
          </div>

          <!-- 图表区域 -->
          <div class="chart-area">
            <div class="chart-bars-container">
              <div
                v-for="(value, index) in periodStats.dailyStats.slice(0, 20)"
                :key="index"
                class="chart-bar"
                :style="{ height: `${normalizeHeight(value)}%` }"
              ></div>
            </div>
            
            <!-- X轴标签 -->
            <div class="chart-x-axis">
              <span v-for="(label, index) in chartLabels" :key="index">{{ label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类报告 -->
      <div class="category-report-card">
        <div class="category-header">
          <h3 class="category-title">Categorized Report</h3>
          
          <!-- 分类类型切换 -->
          <div class="category-type-toggle">
            <button 
              :class="['toggle-btn', { active: selectedCategoryType === 'expense' }]"
              @click="selectedCategoryType = 'expense'"
            >
              Expense
            </button>
            <button 
              :class="['toggle-btn', { active: selectedCategoryType === 'income' }]"
              @click="selectedCategoryType = 'income'"
            >
              Income
            </button>
          </div>
        </div>

        <div class="category-content">
          <!-- 饼图 -->
          <div class="pie-chart-wrapper">
            <div class="pie-chart-center">
              <p class="pie-label">Expense</p>
              <p class="pie-value">100%</p>
            </div>
            <svg class="pie-chart" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-border)" stroke-width="3"></circle>
              <circle 
                v-for="(report, index) in filteredCategoryReports.slice(0, 4)" 
                :key="report.categoryId"
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                :stroke="report.categoryColor"
                :stroke-dasharray="`${report.percentage} ${100 - report.percentage}`"
                :stroke-dashoffset="index === 0 ? 0 : -filteredCategoryReports.slice(0, index).reduce((sum, r) => sum + r.percentage, 0)"
                stroke-width="3"
              ></circle>
            </svg>
          </div>

          <!-- 分类列表 -->
          <div class="category-list">
            <div
              v-for="report in filteredCategoryReports.slice(0, 5)"
              :key="report.categoryId"
              class="category-item"
            >
              <div 
                class="category-icon"
                :style="{ 
                  backgroundColor: `${report.categoryColor}20`,
                  borderColor: `${report.categoryColor}30`,
                  color: report.categoryColor
                }"
              >
                <span class="material-symbols-outlined">{{ report.categoryIcon }}</span>
              </div>
              
              <div class="category-details">
                <div class="category-name-row">
                  <span class="category-name">{{ report.categoryName }}</span>
                  <span class="category-amount">{{ formatCurrency(report.totalAmount) }}</span>
                </div>
                
                <div class="category-stats-row">
                  <span class="category-percentage">{{ report.percentage.toFixed(0) }}%</span>
                  <span :class="['category-change', report.change >= 0 ? 'text-pink' : 'text-primary']">
                    <span class="material-symbols-outlined">
                      {{ report.change >= 0 ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                    {{ Math.abs(report.change).toFixed(2) }}
                  </span>
                </div>
                
                <div class="category-progress">
                  <div 
                    class="category-progress-bar"
                    :style="{ 
                      width: `${report.percentage}%`,
                      backgroundColor: report.categoryColor
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 每日报告表格 -->
    <section class="daily-report-section">
      <div class="daily-report-header">
        <h3 class="daily-report-title">Daily Report</h3>
        <p class="daily-report-subtitle">
          Avg. Daily Expense: {{ formatCurrency(periodStats.avgDailyExpense) }}
        </p>
      </div>

      <div class="daily-report-table">
        <div class="table-header">
          <span>Date</span>
          <span>Income</span>
          <span>Expense</span>
          <span>Balance</span>
        </div>
        
        <div class="table-body">
          <div
            v-for="report in periodStats.dailyReports.slice(0, 10)"
            :key="report.date"
            class="table-row"
          >
            <span>{{ formatDate(report.date) }}</span>
            <span>{{ formatCurrency(report.income) }}</span>
            <span>{{ formatCurrency(report.expense) }}</span>
            <span :class="report.balance >= 0 ? 'text-primary' : 'text-pink'">
              {{ formatCurrency(report.balance) }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped src="@/styles/views/desktop-reports.css"></style>
