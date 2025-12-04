<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NCard, 
  NGrid, 
  NGi, 
  NButton, 
  NSpace,
  NStatistic,
  NDataTable,
  NRadioGroup,
  NRadioButton,
  NProgress,
  NSelect
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import { useCurrencyFormat } from '@/hooks'
import { MonthYearPicker, BarLineChart, PieChart } from '@/components/desktop'
import type { ReportPeriod } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 当前选择的期间类型
const selectedPeriod = ref<ReportPeriod>('month')

// 当前选择的年月
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth())

// 期间选择器时间戳
const periodPickerTimestamp = computed({
  get: () => new Date(selectedYear.value, selectedMonth.value, 1).getTime(),
  set: (val: number) => {
    const date = new Date(val)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth()
  }
})

// 年份选择器选项
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => ({
    label: String(current - 5 + i),
    value: current - 5 + i
  }))
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

// 图表类型（柱状图/折线图）
type ChartViewType = 'bar' | 'line'
const chartViewType = ref<ChartViewType>('bar')

// 图表数据类型（支出/收入/两者）
type ChartDataType = 'expense' | 'income' | 'both'
const chartDataType = ref<ChartDataType>('both')

// ECharts 图表数据
const echartsData = computed(() => {
  const { expenseStats, incomeStats } = periodStats.value
  
  // 生成标签
  const labels = selectedPeriod.value === 'month'
    ? Array.from({ length: expenseStats.length }, (_, i) => String(i + 1))
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return labels.map((label, i) => ({
    label,
    income: incomeStats[i] ?? 0,
    expense: expenseStats[i] ?? 0
  }))
})

// 当前选择的分类类型（expense/income）
const selectedCategoryType = ref<'expense' | 'income'>('expense')

// 过滤后的分类报告
const filteredCategoryReports = computed(() => {
  return selectedCategoryType.value === 'expense' 
    ? periodStats.value.expenseCategoryReports 
    : periodStats.value.incomeCategoryReports
})

// 饼图总金额
const pieChartTotal = computed(() => {
  return selectedCategoryType.value === 'expense' 
    ? periodStats.value.totalExpense 
    : periodStats.value.totalIncome
})

// ECharts 饼图数据
const pieChartData = computed(() => {
  return filteredCategoryReports.value.slice(0, 6).map(report => ({
    name: report.categoryName,
    value: report.totalAmount,
    color: report.categoryColor
  }))
})

// 报告表格列配置（根据期间类型动态）
const reportColumns = computed((): DataTableColumns<any> => [
  {
    title: selectedPeriod.value === 'month' ? t('chart.date') : t('chart.month'),
    key: 'date',
    width: 100
  },
  {
    title: t('reports.income'),
    key: 'income',
    render: (row) => h('span', { style: { color: 'var(--color-income)' } }, formatCurrency(row.income))
  },
  {
    title: t('reports.expense'),
    key: 'expense',
    render: (row) => h('span', { style: { color: 'var(--color-expense)' } }, formatCurrency(row.expense))
  },
  {
    title: t('reports.balance'),
    key: 'balance',
    render: (row) => h(
      'span',
      { style: { color: row.balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' } },
      formatCurrency(row.balance)
    )
  }
])

// 报告数据（月度显示每日，年度显示每月）
const reportData = computed(() => {
  if (selectedPeriod.value === 'month') {
    return periodStats.value.dailyReports.slice(0, 15)
  } else {
    return periodStats.value.monthlyReports
  }
})
</script>

<template>
  <div class="reports">
    <!-- Header -->
    <header class="reports-header">
      <div class="header-left">
        <h1 class="reports-title">{{ t('reports.title') }}</h1>
      </div>
      <n-space align="center" :size="16">
        <!-- 期间选择器 -->
        <n-space align="center" :size="8">
          <n-button text @click="goToPrevious">
            <span class="material-symbols-outlined">chevron_left</span>
          </n-button>
          <!-- 月度：使用 MonthYearPicker -->
          <MonthYearPicker 
            v-if="selectedPeriod === 'month'"
            v-model:value="periodPickerTimestamp" 
          />
          <!-- 年度：使用年份下拉框 -->
          <n-select
            v-else
            v-model:value="selectedYear"
            :options="yearOptions"
            size="small"
            :style="{ width: '90px' }"
          />
          <n-button text @click="goToNext">
            <span class="material-symbols-outlined">chevron_right</span>
          </n-button>
        </n-space>

        <!-- 期间类型切换 -->
        <n-radio-group v-model:value="selectedPeriod" name="period">
          <n-radio-button value="month">{{ t('reports.month') }}</n-radio-button>
          <n-radio-button value="year">{{ t('reports.year') }}</n-radio-button>
        </n-radio-group>
      </n-space>
    </header>

    <!-- 统计卡片 -->
    <n-grid cols="1 s:2 l:4" :x-gap="24" :y-gap="16" responsive="screen" class="stats-grid">
      <n-gi>
        <n-card class="stats-card" :bordered="true">
          <n-statistic :label="t('reports.expense')" :value="formatCurrency(periodStats.totalExpense)" tabular-nums>
            <template #suffix>
              <span :class="['stats-change', periodStats.expenseChange >= 0 ? 'text-pink' : 'text-primary']">
                {{ formatChangePercentage(periodStats.expenseChange) }} {{ t('reports.vsLast') }} {{ selectedPeriod === 'month' ? t('reports.month') : t('reports.year') }}
              </span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stats-card" :bordered="true">
          <n-statistic :label="t('reports.income')" :value="formatCurrency(periodStats.totalIncome)" tabular-nums>
            <template #suffix>
              <span class="stats-change text-muted">
                {{ periodStats.totalIncome > 0 ? t('reports.incomeLogged') : t('reports.noIncomeLogged') }}
              </span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stats-card" :bordered="true">
          <n-statistic :label="t('reports.balance')" tabular-nums>
            <template #default>
              <span :style="{ color: periodStats.balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }">
                {{ formatCurrency(periodStats.balance) }}
              </span>
            </template>
            <template #suffix>
              <span class="stats-change text-muted">
                {{ periodStats.balance >= 0 ? t('reports.surplus') : t('reports.needsAttention') }}
              </span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stats-card" :bordered="true">
          <n-statistic :label="t('reports.avgDailyExpense')" :value="formatCurrency(periodStats.avgDailyExpense)" tabular-nums>
            <template #suffix>
              <span class="stats-change text-muted">{{ t('reports.steadySpending') }}</span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 图表和分类报告 -->
    <n-grid cols="1 l:2" :x-gap="24" :y-gap="16" responsive="screen" class="charts-section">
      <!-- 统计图表 -->
      <n-gi>
        <n-card class="daily-chart-card" :bordered="true">
          <template #header>
            <div class="chart-header">
              <h3 class="chart-title">{{ selectedPeriod === 'month' ? t('reports.dailyStatistics') : t('reports.monthlyStatistics') }}</h3>
              <n-space :size="8">
                <!-- 图表类型切换 -->
                <n-button 
                  text 
                  :class="{ 'icon-active': chartViewType === 'bar' }"
                  @click="chartViewType = 'bar'"
                >
                  <span class="material-symbols-outlined">bar_chart</span>
                </n-button>
                <n-button 
                  text 
                  :class="{ 'icon-active': chartViewType === 'line' }"
                  @click="chartViewType = 'line'"
                >
                  <span class="material-symbols-outlined">show_chart</span>
                </n-button>
                <!-- 数据类型切换 -->
                <n-radio-group v-model:value="chartDataType" size="small">
                  <n-radio-button value="expense">{{ t('reports.expense') }}</n-radio-button>
                  <n-radio-button value="income">{{ t('reports.income') }}</n-radio-button>
                  <n-radio-button value="both">{{ t('common.all') }}</n-radio-button>
                </n-radio-group>
              </n-space>
            </div>
          </template>

          <!-- ECharts 图表 -->
          <BarLineChart
            :data="echartsData"
            :type="chartViewType"
            :show-income="chartDataType === 'income' || chartDataType === 'both'"
            :show-expense="chartDataType === 'expense' || chartDataType === 'both'"
            height="280px"
          />
        </n-card>
      </n-gi>

      <!-- 分类报告 -->
      <n-gi>
        <n-card class="category-report-card" :bordered="true">
          <template #header>
            <div class="category-header">
              <h3 class="category-title">{{ t('reports.categorizedReport') }}</h3>
              
              <!-- 分类类型切换 -->
              <n-radio-group v-model:value="selectedCategoryType" size="small">
                <n-radio-button value="expense">{{ t('reports.expense') }}</n-radio-button>
                <n-radio-button value="income">{{ t('reports.income') }}</n-radio-button>
              </n-radio-group>
            </div>
          </template>

          <div class="category-content">
            <!-- ECharts 饼图 -->
            <div class="pie-chart-wrapper">
              <PieChart
                :data="pieChartData"
                :center-label="selectedCategoryType === 'expense' ? t('reports.expense') : t('reports.income')"
                :center-value="formatCurrency(pieChartTotal)"
                height="180px"
              />
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
                      <span class="material-symbols-outlined icon-small">
                        {{ report.change >= 0 ? 'arrow_upward' : 'arrow_downward' }}
                      </span>
                      {{ formatCurrency(Math.abs(report.change)) }}
                    </span>
                  </div>
                  
                  <n-progress 
                    type="line" 
                    :percentage="report.percentage" 
                    :show-indicator="false"
                    :color="report.categoryColor"
                    :height="4"
                  />
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 收支报告表格 -->
    <n-card class="daily-report-card" :bordered="true">
      <template #header>
        <div class="daily-report-header">
          <h3 class="daily-report-title">{{ selectedPeriod === 'month' ? t('reports.dailyReport') : t('reports.monthlyReport') }}</h3>
          <span class="daily-report-subtitle">
            {{ t('reports.avgDailyExpense') }}: {{ formatCurrency(periodStats.avgDailyExpense) }}
          </span>
        </div>
      </template>
      <n-data-table
        :columns="reportColumns"
        :data="reportData"
        :bordered="false"
        size="small"
      />
    </n-card>
  </div>
</template>

<style scoped>
.reports {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reports-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .reports-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.reports-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.reports-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.period-display {
  font-weight: 600;
  color: var(--color-text-strong);
  min-width: 100px;
  text-align: center;
}

/* 统计卡片 */
.stats-grid {
  margin-top: 8px;
}

.stats-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.stats-card :deep(.n-statistic-value) {
  font-size: 1.5rem !important;
  font-weight: 700;
}

.stats-change {
  display: block;
  font-size: 0.75rem;
  margin-top: 8px;
}

.text-muted {
  color: var(--color-text-muted);
}

.text-pink {
  color: var(--color-expense);
}

.text-primary {
  color: var(--color-primary);
}

/* 图表区域 */
.charts-section {
  margin-top: 8px;
}

.daily-chart-card,
.category-report-card,
.daily-report-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.chart-header,
.category-header,
.daily-report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.chart-title,
.category-title,
.daily-report-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.daily-report-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.icon-active {
  color: var(--color-primary) !important;
}

/* 分类报告 */
.category-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin-top: 16px;
}

@media (min-width: 640px) {
  .category-content {
    flex-direction: row;
    align-items: flex-start;
  }
}

.pie-chart-wrapper {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.category-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid;
}

.category-details {
  flex: 1;
  min-width: 0;
}

.category-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-weight: 600;
  color: var(--color-text-strong);
}

.category-amount {
  font-weight: 600;
  color: var(--color-text-strong);
}

.category-stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0;
}

.category-percentage {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.category-change {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
}

.icon-small {
  font-size: 14px;
}
</style>
